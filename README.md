# WookieMarket Backend App

## Install dependencies

```sh
    npm install
```

## Start in development mode:

```sh
    npm run dev
```

## start the email microservice

### open a new console position yourself in the emailMicroService folder and run this command

```
npm node emailService.js
```

## Setup enviroments variables

- Copy `.env.example` to `.env` and customize your local variables.

```sh
    # set the values after creating '.env' file
    cp .env.example .env
```

## Initialize the database

- Load some initial data. Make sure your MongoDB Server is running.

```sh
    # Run the init script.
    npm run initDB
```
