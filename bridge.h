#ifndef _BRIDGE_H_
#define _BRIDGE_H_

#include <QObject>
#include <QWidget>

class Bridge : public QObject
{
    Q_OBJECT

public:
    Bridge(QWidget *);
    QWidget *top;
    Q_INVOKABLE void setVisible(bool);
};

#endif
