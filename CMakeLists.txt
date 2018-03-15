cmake_minimum_required(VERSION 2.6 FATAL_ERROR)
project(notification-ui)

set (CMAKE_CXX_STANDARD 11)

set(CMAKE_INCLUDE_CURRENT_DIR ON)

# ---------- qt
find_package(Qt5Widgets)
find_package(Qt5WebKitWidgets CONFIG)

set(CMAKE_AUTOMOC ON)

# ---------- exe
add_executable(notification-ui
  main.cpp bridge.cpp mainwindow.cpp)

target_link_libraries ( notification-ui
    Qt5::Widgets Qt5::WebKitWidgets )

# ----------- install
INSTALL(TARGETS notification-ui RUNTIME DESTINATION bin)
INSTALL(PROGRAMS notification-ui.sh DESTINATION bin)
INSTALL(DIRECTORY html DESTINATION share/notification-ui)
INSTALL(DIRECTORY emacs DESTINATION share/notification-ui)
