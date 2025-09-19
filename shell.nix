let pkgs = import <nixpkgs> {};

in pkgs.mkShell {
    buildInputs = with pkgs; [
        python310
        python310Packages.setuptools
        python310Packages.pip
        python310Packages.virtualenv
        python310Packages.wheel
        pnpm
    ];

  shellHook = ''
    source .venv/bin/activate
  '';

}
