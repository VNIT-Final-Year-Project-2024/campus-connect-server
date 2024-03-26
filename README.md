# Campus Connect Server

This repository is for the backend of the Campus Connect application. 
The Campus Connect server provides the necessary APIs and functionalities to support the Campus Connect web client.

## Features

- User signup and login
- User authentication and authorization
- Messaging and Groups functionality
- Real-time updates

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/VNIT-Final-Year-Project-2024/campus-connect-server.git
    ```

2. Set up the environment variables. Create a `.env` file in the root directory and provide the following variables:

    ```plaintext
    CLIENT_URL - the client's url for enabling CORS

    SQL_DB_HOST - mysql host url
    SQL_DB_USER - mysql user with access to the database
    SQL_DB_PASSWORD - mysql user's password
    SQL_DB_SCHEMA - schema to use from mysql database 

    JWT_SECRET_KEY - key to hash user passwords for persistence

    MONGO_DB_URI - mongoDB host address

    APP_MAIL_ID - email ID to use for automated mails

    *AWS credential store*
    AWS_ACCESS_KEY_ID
    AWS_SECRET_ACCESS_KEY
    AWS_SES_REGION
    ```

3. Build the docker image:

    ```bash
    docker-compose --build
    ```

4. Start the server:

    ```bash
    docker-compose up
    ```

5. Stop the server:

    ```bash
    docker-compose down
    ```

6. Remove the mounted volumes

    ```bash
    docker-compose down -v
    ```

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.

## License

This project is yet to be licensed.

## Contact

For any questions or inquiries, please contact the project maintainer at [campus.connect.app.mail@gmail.com](mailto:campus.connect.app.mail@gmail.com).


##
<div align="center">
Built with ❤️ by students @ VNIT
</div>

