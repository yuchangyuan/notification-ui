{ stdenv, qt5, pkgconfig, cmake }:
stdenv.mkDerivation rec {
  name = "notification-ui";
  version = "0";
  src = ./.;
  nativeBuildInputs = [ pkgconfig cmake ];
  propagatedBuildInputs = [
    qt5.full qt5.qtwebkit
  ];
}
