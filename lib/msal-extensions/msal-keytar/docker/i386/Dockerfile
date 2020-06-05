FROM i386/debian:stretch

RUN apt-get update
RUN apt-get install --quiet --yes \
    build-essential \
    curl \
    pkg-config \
    clang \
    python \
    libsecret-1-dev

RUN curl -sL https://deb.nodesource.com/setup_9.x | bash -
RUN apt-get install -y nodejs

ENV CC clang
ENV CXX clang++
ENV npm_config_clang 1
