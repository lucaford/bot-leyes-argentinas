# Advanced Node.js Automation Script

This Node.js script demonstrates an advanced automation task that involves web scraping, PDF handling, social media interactions through Twitter, and leveraging AI with OpenAI's API. Below are the components of the script and their functionalities.

## Features

- **Web Scraping with Puppeteer**: Navigates to specified URLs and interacts with web elements to download content.
- **Twitter Integration**: Posts tweets and can create a thread based on AI-generated responses.
- **OpenAI Integration**: Uses OpenAI's API to send messages and process responses.
- **PDF Handling**: Downloads, reads, and extracts text from PDF files.
- **File System Operations**: Manages file download locations and cleans up by deleting files after processing.

## Dependencies

- `puppeteer`: For automating browser tasks.
- `twitter-api-v2`: For interacting with the Twitter API.
- `openai`: For communicating with OpenAI's models.
- `pdf-parse`: For extracting text from PDF files.
- `fs`: For file system operations.
- `path`: For handling file paths.

## Setup

1. **Install Node.js**: Ensure Node.js is installed on your system.
2. **Install Dependencies**: Run `npm install puppeteer twitter-api-v2 openai pdf-parse` to install necessary packages.
3. **API Keys**: Make sure to replace placeholder API keys and tokens in the script with your valid credentials for Twitter and OpenAI.

## Key Functions

- `sendMessageToAssistant(message)`: Sends a message to OpenAI's Assistant and waits for a response.
- `sendTweet(text)`: Tweets the given text to a specified Twitter account.
- `getContent(links)`: Uses Puppeteer to scrape content from given URLs and download any associated files.
- `readAllAvisoPDFs()`: Reads all PDF files with a specific prefix, extracts their text, and processes them.
- `askAndTweet()`: Orchestration function that combines scraping, AI interaction, and tweeting in a workflow.

## Usage

To run the script, use:
`node index.js`
