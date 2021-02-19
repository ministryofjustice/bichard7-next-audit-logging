FROM ubuntu:20.04

RUN mkdir /code
WORKDIR /code

# Install curl, unzip, python3 and pip3
RUN apt update
RUN apt install -y curl unzip python3 python3-pip

# Install awslocal
RUN pip3 install awscli-local

# Manually install the AWS CLI v2
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
RUN unzip awscliv2.zip
RUN ./aws/install

# Copy files requires for setting up the infrastructure
COPY attributes.json .
COPY environment.json .
COPY *.sh ./

RUN chmod +x *.sh

CMD [ "./docker-start.sh" ]
