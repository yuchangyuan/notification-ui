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
}
