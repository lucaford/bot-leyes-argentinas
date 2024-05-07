const puppeteer = require("puppeteer");
const { TwitterApi } = require("twitter-api-v2");
const { OpenAI } = require("openai");
const path = require("path");
const pdf = require("pdf-parse");
const fs = require("fs");

const twitterClient = new TwitterApi({
  appKey: "",
  appSecret: "",
  accessToken: "",
  accessSecret: "",
});

const ASSISTANT_ID = "";

const openai = new OpenAI({
  apiKey: "",
});

async function waitForRunCompletion(threadId, runId) {
  let completed = false;
  let response = {};
  while (!completed) {
    try {
      const run = await openai.beta.threads.runs.retrieve(threadId, runId);
      console.log("retrieve thread response: ", run);
      if (run.completed_at) {
        completed = true;
        console.log(`Run completed at ${run.completed_at}`);
        const messagesResponse = await openai.beta.threads.messages.list(
          threadId
        );

        response = JSON.parse(messagesResponse.data[0].content[0].text.value);
      }
    } catch (error) {
      console.error("Error retrieving run:", error);
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));

    if (completed) {
      return response;
    }
  }
}

async function sendMessageToAssistant(message) {
  const threadMessage = await openai.beta.threads.create({
    messages: [{ role: "user", content: message }],
  });

  const run = await openai.beta.threads.runs.create(threadMessage.id, {
    assistant_id: ASSISTANT_ID,
  });

  const response = await waitForRunCompletion(threadMessage.id, run.id);
  return response;
}

async function sendTweet(text) {
  try {
    await twitterClient.v2.tweet(text);
    console.log("Tweet enviado:", text);
  } catch (error) {
    console.error("Error al enviar el tweet:", error);
  }
}

const getContent = async (links) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const client = await page.target().createCDPSession();
  await client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: "./",
  });
  for (const link of links) {
    try {
      await page.goto(link, { waitUntil: "networkidle0" });
      const buttonSelector =
        ".btn.btn-primary.btn-circle.btn-sm.pull-right.bg-first-section";

      await page.waitForSelector(buttonSelector);

      await page.click(buttonSelector);
    } catch (error) {
      console.error(`Error al extraer contenido de ${link}:`, error);
    }
  }

  await browser.close();
};

function listPDFFiles(directory, prefix) {
  return fs
    .readdirSync(directory)
    .filter(
      (file) =>
        file.startsWith(prefix) && path.extname(file).toLowerCase() === ".pdf"
    );
}

async function readPDFs(pdfFiles) {
  const promises = pdfFiles.map(async (file) => {
    const dataBuffer = fs.readFileSync(file);
    try {
      const data = await pdf(dataBuffer);
      return { text: data.text };
    } catch (error) {
      console.error(`Error reading ${file}:`, error);
      return null;
    }
  });

  return Promise.all(promises);
}

async function readAllAvisoPDFs() {
  const directory = "./";
  const prefix = "aviso";
  const pdfFiles = listPDFFiles(directory, prefix);
  const pdfContents = await readPDFs(pdfFiles);
  return pdfContents;
}

async function askAndTweet() {
  const linksToAccess = await getAllLinksToVisit();

  await getContent(linksToAccess);

  const pdfContents = await readAllAvisoPDFs();
  const response = await sendMessageToAssistant(JSON.stringify(pdfContents));

  if (response) {
    let lastTweetId = null;

    for (const tweet of response) {
      const tweetData = {
        text: `${tweet.title}\n${tweet.description}`,
        ...(lastTweetId
          ? { reply: { in_reply_to_tweet_id: lastTweetId } }
          : {}),
      };
      const twitResponse = await twitterClient.v2.tweet(tweetData);
      lastTweetId = twitResponse.data.id;
    }
    console.log("Thread posted successfully!");
  } else {
    console.log("No se obtuvo respuesta para twittear.");
  }

  deletePDFFiles();
}

function deletePDFFiles() {
  fs.readdir("./", (err, files) => {
    if (err) {
      console.error("Error al listar los archivos del directorio:", err);
      return;
    }

    files.forEach((file) => {
      if (path.extname(file).toLowerCase() === ".pdf") {
        fs.unlink(path.join("./", file), (err) => {
          if (err) {
            console.error(`Error al eliminar el archivo ${file}:`, err);
          } else {
            console.log(`Archivo ${file} eliminado con éxito.`);
          }
        });
      }
    });
  });
}

async function getAllLinksToVisit() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto("https://www.boletinoficial.gob.ar/seccion/primera", {
    waitUntil: "networkidle0",
  });

  const links = await page.evaluate(() => {
    const pElements = Array.from(document.querySelectorAll("p"));

    const linksToClick = [];
    pElements.forEach((paragraph) => {
      if (paragraph.innerText.includes("RESOL-")) {
        const a = paragraph.closest("a");
        if (a) {
          linksToClick.push(a.href);
        }
      }
    });
    return linksToClick;
  });
  await browser.close();

  return links;
}

askAndTweet();
