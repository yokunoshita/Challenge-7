let nodemailer = require('nodemailer');
let { google } = require('googleapis');
let ejs = require('ejs');

const{
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN
} = process.env

let oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
);

oauth2Client.setCredentials({
    refresh_token: GOOGLE_REFRESH_TOKEN
});

module.exports = {
    sendMail: async (to, subject, html) => {
        try {
            let accessToken = await oauth2Client.getAccessToken();
            let transport = nodemailer.createTransport({
                service:'gmail',
                auth: {
                    type: 'OAuth2',
                    user: 'hanafiulinnuha1812@gmail.com',
                    clientId: GOOGLE_CLIENT_ID,
                    clientSecret: GOOGLE_CLIENT_SECRET,
                    refreshToken: GOOGLE_REFRESH_TOKEN,
                    accessToken: accessToken
                }
            });
    
            transport.sendMail({
                to,
                subject,
                html
            });
    
        } catch (err) {
            console.log(err);
        }
    },

    getHtml: (filename, data) => {
        return new Promise((resolve, reject) => {
            const path = `${__dirname}/../views/templates/${filename}`;
            ejs.renderFile(path, data, (error, data) => {
                if (error) {
                    return reject(error);
                }
                return resolve(data);
            });
        });
    }
};





