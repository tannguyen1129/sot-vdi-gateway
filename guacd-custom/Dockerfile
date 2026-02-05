# Dùng bản Debian để dễ cài thư viện (Alpine rất khó cài FFmpeg chuẩn cho Guacamole)
FROM debian:bookworm-slim

# 1. Cài đặt các thư viện cần thiết để biên dịch Guacamole Server
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libjpeg62-turbo-dev \
    libpng-dev \
    libtool-bin \
    libossp-uuid-dev \
    libavcodec-dev \
    libavformat-dev \
    libavutil-dev \
    libswscale-dev \
    freerdp2-dev \
    libpango1.0-dev \
    libssh2-1-dev \
    libtelnet-dev \
    libvncserver-dev \
    libwebsockets-dev \
    libpulse-dev \
    libssl-dev \
    libvorbis-dev \
    libwebp-dev \
    git \
    make \
    autoconf \
    automake \
    wget \
    && rm -rf /var/lib/apt/lists/*

# 2. Tải Source Code Guacamole Server (Phiên bản 1.5.5 hoặc mới nhất ổn định)
WORKDIR /tmp
RUN wget https://apache.org/dyn/closer.lua/guacamole/1.5.5/source/guacamole-server-1.5.5.tar.gz?action=download -O guacamole-server.tar.gz \
    && tar -xzf guacamole-server.tar.gz \
    && mv guacamole-server-1.5.5 guacamole-server

# 3. Biên dịch và Cài đặt (Tự động nhận diện thư viện FFmpeg/H.264)
WORKDIR /tmp/guacamole-server
RUN ./configure --with-init-dir=/etc/init.d \
    && make \
    && make install \
    && ldconfig

# 4. Tạo user và dọn dẹp
RUN useradd -m guacd
EXPOSE 4822

# 5. Chạy guacd
CMD ["/usr/local/sbin/guacd", "-b", "0.0.0.0", "-f"]