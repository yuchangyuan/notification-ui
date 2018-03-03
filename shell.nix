let
  pkgs = import <nixpkgs> {};
  stdenv = pkgs.stdenv;
in with pkgs; stdenv.mkDerivation rec {
  name = "build-env";
  nativeBuildInputs = [ pkgconfig cmake ];
  propagatedBuildInputs = [
    qt5.full qt5.qtwebkit
  ];
}

