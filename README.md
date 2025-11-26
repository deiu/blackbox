# Blackbox Secure

Blackbox Secure is a zero-knowledge, encrypted file and message sharing application. It allows users to share sensitive information and files securely, ensuring that the server never has access to the unencrypted data.

## Features

*   **Client-Side Encryption**: All data is encrypted in the browser using AES-256-GCM before being sent to the server.
*   **Zero-Knowledge Architecture**: The decryption key is generated on the client and included in the shareable link fragment, meaning the server never sees the key or the raw data.
*   **Self-Destructing Links**: Configure expiration times and view limits for shared links.
*   **Secure File Sharing**: Support for encrypted file uploads.
*   **Modern UI**: A premium, terminal-inspired interface built with React and Tailwind CSS.

## Tech Stack

*   **Client**: React, Vite, Tailwind CSS
*   **Encryption**: Web Crypto API (AES-GCM)
*   **Server**: Node.js
