# Audit Log Portal

This is a Next.js project. The purpose of which is to grant an admin a view of the messages recorded within the Bichard7 system along with any additional events of information.

## Development

In order to develop against this project locally, you will need to install the dependencies and then run the dev command.

> Note: Before running this command, you will need to ensure that the [Audit Log API](../audit-log-api#README.md) is running first.

```bash
npm i
npm run dev
```

> Note: Running the dev command will create a local `.env.local` file dynamically with the API endpoint.

## Testing

### Unit Tests

In order to run unit tests, you need to run the following command:

```bash
npm run test
```

### UI Tests

Before running UI tests, you need to run the application using the following command. This will run the application and mock the API:

```bash
npm run start:mocked
```

Once the application is running, you can run UI tests by running the command below:

```bash
npm run test:ui
```
