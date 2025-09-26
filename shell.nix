let pkgs = import <nixpkgs> {};

in pkgs.mkShell {
    buildInputs = with pkgs; [
        python313
        python313Packages.setuptools
        python313Packages.pip
        python313Packages.virtualenv
        python313Packages.wheel
        pnpm
    ];

  shellHook = ''
    source .venv/bin/activate
  '';

}
