FROM node:10.1
MAINTAINER shree dee <dee@labizbille.com>

RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
    \
	&& rm -rf /var/lib/apt/lists/* 

EXPOSE 80
EXPOSE 9222

COPY package.json .
RUN npm i

COPY ./src/ /src/

CMD ["npm", "start"]
