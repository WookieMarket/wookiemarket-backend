# WookieMarket Backend App

## Development Environment

### Install dependencies

```sh
    npm install
```

### Start in development mode:

```sh
    npm run dev
```

## Deploy email microservice

```sh
    # On new window console move to 'emailMicroService'
    npm install
    npm start
```

## Setup enviroments variables

```sh
    # Copy `.env.example` to `.env` file and customize your local variables.
    cp .env.example .env
```

## Initialize the database

- Load some initial data.

```sh
    # Make sure your MongoDB Server is running.
    # wherMove to directory where your Mongo is installed
     ./bin/mongod --dbpath ./data

    # Run the init script.
    npm run initDB
```
