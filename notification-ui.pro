QT +=  webkitwidgets network widgets

TEMPLATE = app
TARGET = notification-ui
DEPENDPATH += .
INCLUDEPATH += .

# Input
HEADERS += mainwindow.h
SOURCES += main.cpp mainwindow.cpp

# mac
macx {
    LIBS += -lobjc

    APP_QML_FILES.files = html
    APP_QML_FILES.path = Contents/Resources
    QMAKE_BUNDLE_DATA += APP_QML_FILES
}
