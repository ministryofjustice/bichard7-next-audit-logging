## Testing locally
Follow these steps to run the lambda locally.

1. Spin up the environment using Docker Compose. This creates a Docker network within which to run the local infrastructure and spins up Local Stack and a local IBM MQ instance.

```bash
$ docker-compose up
```

2. Build the local changes. This can either be done by running the default VSCode build task (Ctrl+Shift+B), or with the following command from the terminal in the root of the project directory.

```bash
$ npm run build
```

3. From another terminal (or the same if you detached the spin up step), setup the local AWS infrastructure. This will create an AWS SQS queue, the AWS Lambda (using the locally built code) and trigger the lambda when messages are received on the queue.

```bash
$ ./setup_infra.sh
```

> Note: If you make changes to the lambda code, you will only need to re-build the code (using `npm run build`) as the lambda is mapped to the output directory (`build/`).

4. Once the AWS infrastructure has been setup, you can send a simulated message to the AWS SQS queue.

```bash
$ ./send_message.sh
```

5. Check that the message has been received in the IBM MQ console.
- Go to the URL https://localhost:10443/ in the browser, and login with the following credentials:
  **Username:** admin
  **Password:** passw0rd
- Click on the Queue Manager named `BR7_QM`
- Click on the Queue named `DEV.QUEUE.1`
- You should see the message that has just been sent
