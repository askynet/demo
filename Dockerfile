FROM ubuntu:24.04

RUN apt-get update && \
    apt-get install -y wget

RUN wget \
    https://github.com/coder/code-server/releases/download/v4.104.2/code-server_4.104.2_amd64.deb \
    -O /tmp/code-server.deb

RUN apt-get update && \
    apt-get install -y /tmp/code-server.deb

RUN mkdir -p /workspace \
    /tmp/.config \
    /tmp/.local/share/code-server

RUN chmod -R 777 /workspace \
    /tmp

ENV HOME=/tmp
ENV XDG_CONFIG_HOME=/tmp/.config
ENV XDG_DATA_HOME=/tmp/.local/share

EXPOSE 8080

CMD ["/usr/bin/code-server","--bind-addr","0.0.0.0:8080","--auth","none","/workspace"]
