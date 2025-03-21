import os
import subprocess
import json
import click

# Terraform Configuration Template
TERRAFORM_CONFIG_TEMPLATE = """
provider "aws" {{
  region = "{region}"
}}

variable "instance_type" {{
  default = "{instance_type}"
}}

variable "ssh_key_name" {{
  default = "{ssh_key_name}"
}}

resource "aws_key_pair" "nixos_key_2" {{
    key_name   = {key_name}
    public_key = file(var.ssh_key_name)
}}

resource "aws_security_group" "nixos_sg" {{
  name        = "nixos-security-group-test"
  description = "Allow SSH, HTTP, and HTTPS"

  ingress {{
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Allows SSH from anywhere (be careful!)
  }}

  ingress {{
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }}

  ingress {{
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }}

  egress {{
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }}
}}

resource "aws_instance" "nixos_vm" {{
  ami           = "{ami_id}"
  instance_type = var.instance_type
  key_name      = var.ssh_key_name

  tags = {{
    Name = "{instance_name}"
  }}

  root_block_device {{
    volume_size           = 20
    volume_type           = "gp3"
    delete_on_termination = true
  }}

  vpc_security_group_ids = [aws_security_group.nixos_sg.id]

user_data = <<-USERDATA
#!/bin/bash
exec > /var/log/user-data.log 2>&1  # Log everything for debugging

echo "📌 Expanding disk space..."
growpart /dev/xvda 1
resize2fs /dev/xvda1

echo "📌 Modifying NixOS configuration..."
mkdir -p /etc/nixos

# Overwrite configuration.nix to include AWS image settings + package installation
cat <<EOF > /etc/nixos/configuration.nix
{{config,modulesPath, pkgs, lib, ... }}:

let
  bitswan-gitops-cli = pkgs.stdenv.mkDerivation {{
    name = "bitswan-gitops-cli";
    version = "latest";

    src = pkgs.fetchurl {{
      url = "https://github.com/bitswan-space/bitswan-workspaces/releases/download/0.2.12/bitswan-workspaces_0.2.12_linux_amd64.tar.gz";
      # Add sha256 hash for reproducibility
      sha256 = "sha256-gCazeTgsUtC2nCHRfE85hQ6BF0Lu++lHG1Oo8hUG7hQ=";
    }};

    sourceRoot = ".";

    installPhase = ''
      mkdir -p \$out/bin
      cp bitswan-gitops-cli \$out/bin/
      chmod +x \$out/bin/bitswan-gitops-cli
    '';
  }};
in {{
  imports = [ "/nix/var/nix/profiles/per-user/root/channels/nixos/nixos/modules/virtualisation/amazon-image.nix" ];




  # Install packages system-wide
  environment.systemPackages = with pkgs; [
    vim git htop wget curl docker mkcert bitswan-gitops-cli
  ];

  # Enable Docker service
  virtualisation.docker.enable = true;

  # Ensure the  group exists
  users.extraGroups.docker.members = [ "root" ];

  # Open necessary firewall ports (SSH, HTTP, HTTPS)
  networking.firewall.allowedTCPPorts = [ 22 80 443 ];

  # Enable SSH for remote access and force root login
  services.openssh.enable = true;
  services.openssh.settings.PermitRootLogin = lib.mkForce "yes";

  # Set system version (ensure compatibility)
  system.stateVersion = "24.11";
}}
EOF

echo "📌 Applying new NixOS configuration..."
nixos-rebuild switch
echo "✅ Setup complete!"
USERDATA
}}

output "instance_ip" {{
  value = aws_instance.nixos_vm.public_ip
}}
"""

# Helper function to execute Terraform commands
def run_terraform(command):
    """Executes a Terraform command and returns the output."""
    try:
        result = subprocess.run(command, shell=True,
                                check=True, capture_output=True, text=True)
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {command}")
        print(e.stderr)
        return None


# CLI App using Click
@click.command()
@click.option("--deploy", is_flag=True, help="Deploy a NixOS VM on AWS.")
@click.option("--destroy", is_flag=True, help="Destroy the deployed NixOS VM.")
@click.option("--workspace", default=None, help="Specify the workspace (user) for deployment.")
@click.option("--instance-type", default="t3.medium", help="AWS instance type (default: t3.micro).")
@click.option("--ssh-key", default="~/.ssh/id_rsa.pub", help="AWS SSH key pair name.")
@click.option("--ami-id", default="ami-0503b4af7af4b4281", help="NixOS AMI ID.")
@click.option("--region", default="eu-central-1", help="AWS region to deploy in (default: us-west-1).")
@click.option("--instance-name", default="bitswan-workspace", help="Name of the deployed AWS instance.")
@click.option("--list-workspaces", is_flag=True, help="List all Terraform workspaces.")
@click.option("--delete-workspace", default=None, help="Delete a specific Terraform workspace.")
def main(deploy, destroy, workspace, instance_type, ssh_key, ami_id, region, instance_name, list_workspaces, delete_workspace):
    """Terraform CLI App to Manage NixOS AWS Instances with Workspaces"""

    # Ensure workspaces are initialized
    run_terraform("terraform workspace list")

    if list_workspaces:
        print("📌 Available Terraform Workspaces:")
        print(run_terraform("terraform workspace list"))
        return

    if delete_workspace:
        print(f"⚠️ Deleting Terraform workspace '{delete_workspace}'...")
        run_terraform(f"terraform workspace select default")
        run_terraform(f"terraform workspace delete {delete_workspace}")
        print(f"✅ Workspace '{delete_workspace}' deleted.")
        return

    if not workspace:
        print("❌ No workspace specified. Use --workspace <user_name> to deploy or destroy a VM.")
        return

    print(f"🔄 Switching to workspace '{workspace}'...")
    workspaces = run_terraform("terraform workspace list")

    if f"* {workspace}" not in workspaces and f"  {workspace}" not in workspaces:
        print(f"📌 Creating new workspace '{workspace}'...")
        run_terraform(f"terraform workspace new {workspace}")
    else:
        print(f"✅ Workspace '{workspace}' already exists.")

    if deploy:
        print(f"🚀 Deploying NixOS VM for user '{workspace}'...")

        ssh_key = f"{instance_name}-{workspace}-pub-key"

        terraform_config = TERRAFORM_CONFIG_TEMPLATE.format(
            region=region,
            instance_type=instance_type,
            ssh_key_name=ssh_key,
            ssh_name=ssh_key,
            ami_id=ami_id,
            instance_name=f"{instance_name}-{workspace}"
        )

        # Write Terraform config
        with open("main.tf", "w") as f:
            f.write(terraform_config)

        # Initialize Terraform
        print("🔄 Initializing Terraform...")
        run_terraform("terraform init")

        # Apply Terraform Configuration
        print("⚙️ Applying Terraform Configuration...")
        run_terraform("terraform apply -auto-approve")

        # Get Instance IP
        print("⏳ Fetching Instance Public IP...")
        output = run_terraform("terraform output -json")

        if output:
            parsed_output = json.loads(output)
            instance_ip = parsed_output.get(
                "instance_ip", {}).get("value", "Unknown")
            print(
                f"✅ Instance for {workspace} is running! Public IP: {instance_ip}")
        else:
            print("❌ Failed to retrieve instance details.")

    elif destroy:
        print(f"⚠️ Destroying NixOS VM for user '{workspace}'...")
        run_terraform("terraform destroy -auto-approve")
        print(f"✅ Terraform resources for {workspace} have been destroyed.")

    else:
        print("❌ No action specified. Use --deploy or --destroy.")


if __name__ == "__main__":
    main()
