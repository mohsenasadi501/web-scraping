const puppeteer = require("puppeteer");
const axios = require("axios");
const fs = require("fs");

const url = "https://www.qtermin.de/qtermin-stadt-duisburg-abh-sued";
const selectorText = "Antrag";
const logFile = "log.txt";

function logToFile(message) {
    const logMessage = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFileSync(logFile, logMessage);
    console.log(logMessage);
}

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: "networkidle2" });

        const servicesDiv = await page.$("#services");
        if (!servicesDiv) throw new Error("Dont find #services# div");


        const liHandle = await page.evaluateHandle((servicesDiv) => {
            return [...servicesDiv.querySelectorAll("li")].find(li =>
                li.getAttribute("data-text")?.includes("Antrag")
            );
        }, servicesDiv);
        if (!liHandle) throw new Error("Not found #Antrag#");


        const divCapSel = await liHandle.$(".divCapSel");
        if (!divCapSel) throw new Error("Not found #divCapSel# div");


        const counterPlusSpan = await divCapSel.$(".counterPlus");
        if (!counterPlusSpan) throw new Error("Not found #counterPlus# span");

        await counterPlusSpan.click();
        await counterPlusSpan.click();

        await page.waitForSelector("#bp1", { visible: true, timeout: 1000 });
        const weiterButton = await page.$("#bp1");

        await weiterButton.click();

        try {
            await page.waitForSelector(".WLInfo", { visible: true, timeout: 2000 });
            const slotsText = await page.$(".WLInfo");
            const htmlContent = await page.evaluate(el => el.innerText, slotsText);
            if (htmlContent == 'Es sind keine Termine für die gewünschte Auswahl verfügbar!')
                sendFailNotification('Not Found Free Time')
        }
        catch (error) {
            await page.waitForSelector("#shid", { visible: true, timeout: 2000 });
            const slotsText = await page.$("#shid");
            const htmlContent = await page.evaluate(el => el.innerText, slotsText);
            sendNotification(htmlContent)
        }
    } catch (error) {
        logToFile(`Error in page rendering: ${error.message}`);
    }

    await browser.close();
})();

function sendNotification(message) {
    const botToken = "8166386485:AAHZ1JSgTym47PBxdRUmcqiMFSBLrapVtRo";
    const chatId = "100032292";
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    axios.post(telegramUrl, {
        chat_id: chatId,
        text: message,
    })
        .then(response => console.log("Sent"))
        .catch(error => logToFile(`Error sending notification: ${error.message}`));
}
function sendFailNotification(message) {
    const botToken = "7987089711:AAG3yIVFGcs9AqrVJK7rkNP8Foev6mt9Au8";
    const chatId = "100032292";
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    axios.post(telegramUrl, {
        chat_id: chatId,
        text: message,
    })
        .then(response => console.log("Sent"))
        .catch(error => logToFile(`Error sending fail notification: ${error.message}`));
}
