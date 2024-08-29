import React, { useRef, useEffect, useState } from 'react';
import { gapi } from 'gapi-script';
import { GoogleGenerativeAI } from '@google/generative-ai';
import "./Test.css"
const Test = () => {
    const GEMINIAPI = "AIzaSyCRO3jpEi5P7UH804JdeP4mcTCE-5pldOo";
    const CLIENT_ID = '853842435627-kq2hco263n082s778t0ro5bcn6or8oik.apps.googleusercontent.com';
    const API_KEY = 'AIzaSyARf6_2Sjx2r1MUBCmDfAmr4WbobxIhrJY';
    const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"];
    const SCOPES = "https://www.googleapis.com/auth/gmail.readonly";

    const windowClose = useRef(null)
    const [emails, setEmails] = useState([]);
    const [inputTag, setInputTag] = useState("");
    const [tagArray, setTagArray] = useState([]);
    const [find, setFind] = useState(false);
    const [totalMails, setTotalMails] = useState(0);
    const [mailBasedOnTags, setmailBasedOnTags] = useState([]);
    const [isArray, setIsArray] = useState(false);
    const [isAnalysing , setisAnalysing] = useState(false);

    const findMails = () => {
        setFind(true);
        const start = async () => {
            try {
                await gapi.client.init({
                    apiKey: API_KEY,
                    clientId: CLIENT_ID,
                    discoveryDocs: DISCOVERY_DOCS,
                    scope: SCOPES,
                });
                await gapi.auth2.getAuthInstance().signIn();
                loadEmails();
            } catch (error) {
                console.log('Error initializing Gmail API client:', error);
            }
        };
        gapi.load('client:auth2', start);
    };

    const loadEmails = async () => {
        console.log("Fetching primary emails...");
        try {
            const response = await gapi.client.gmail.users.messages.list({
                'userId': 'me',
                'q': 'in:inbox category:primary'
            });
            const messages = response.result.messages;
            let mailsNumber = 0;
            if (messages) {
                for (let message of messages) {
                    const msgResponse = await gapi.client.gmail.users.messages.get({
                        'userId': 'me',
                        'id': message.id,
                    });
                    console.log("result :: ", msgResponse, "id is :: ", message.id);
                    let senderName;
                    msgResponse.result.payload.headers.forEach(element => {
                        if (element.name === "From") {
                            senderName = element.value;
                        }
                    });
                    setEmails((prev) => [...prev, { sender: senderName, body: msgResponse.result.snippet, id: message.id }]);
                    mailsNumber++;
                    if (mailsNumber == 11) return;
                    setTotalMails(mailsNumber);
                }
            }
            console.log("op :: ", emails);
        }
        catch (error) {
            console.error('Error loading emails:', error);
        }
    };

    const Analyse = async () => {
        setisAnalysing(true);
        let tags = ""
        tagArray.forEach(element => {
            tags += `${element}`
            tags += " ";
        });
        let mailString = "";
        emails.forEach((element, index) =>
            mailString += `${index} ${(element.body)} \n\n`
        );
        console.log("tage ::", tags);
        const genAI = new GoogleGenerativeAI(GEMINIAPI);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt =
            `I will provide you with a list of emails, each represented as an object with the following properties:

        - **sender:** The email sender's address
        - **body:** The email body content

        this is the list ${mailString}

        I will also provide a list of tags that you can use to categorize the emails.

        this is the array of tag ${tags}

        Your task is to analysize each email and give me the array of index number corresponding to the email, the tag should match the email content 

        I dont need a code, you have to manually give me the list

        Most important thing there might be some cases that the tag don't match any of the email so you can give me a string, "no matching tag"

        Moreover I am not asking you to find words whose substrings are the tag you have to analyse each email and figure out if this is related to the tag.

        most important line, no matter how many times I ask you I am just expecting the output to be like this, no explaination, and no text except the [1,2,3,4] , if no matching tage simply give me ""
        something like this
        `;
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        console.log(text);
        const finalAns = JSON.parse(text);
        console.log("finalans is :: ", finalAns);
        console.log(typeof (finalAns));
        try {
            let tempMails = [];
            finalAns.forEach(element => {
                const elem = emails[parseInt(element)];
                tempMails.push({ body: elem.body, sender: elem.sender, id: elem.id });
                console.log("ok :: ", emails[parseInt(element) - 1]);
            });
            console.log("finalArray is :: ", tempMails);
            setmailBasedOnTags(tempMails);
            setIsArray(true);
        }
        catch (error) {
            console.log("are mori maiyaa :: ", error);
            setmailBasedOnTags([]);
        }
    }

    useEffect(() => {
        console.log("ok :: ", mailBasedOnTags);
    }, [mailBasedOnTags])

    const handlePress = (e) => {
        if (e.key === "Enter") {
            console.log("Enter is pressed");
            console.log(inputTag);
            setTagArray((existing) => [...existing, inputTag]);
            setInputTag("");
        }
    }

    const removeTag = (tag) => {
        let temp = tagArray.filter((e) => {
            return e !== tag;
        })
        console.log("before :: ", temp);
        console.log("this :: ", tag);
        setTagArray(temp);
    }

    const handelWindowClose = () => {
        setIsArray(false);
        windowClose.current.style.display = "none";
    }
    

    return (
        <div className="container">
            <div className='float'>
                Mails Fetched : {totalMails}
            </div>
            <h1>
                <center>FindMyMails 📨</center>
            </h1>
            <br />
            <button className='align' onClick={findMails}>
                <div>Find Mails</div>
            </button>
            <br />
            <br />
            <div>
                <input value={inputTag} onChange={(e) => setInputTag(e.target.value)} onKeyPress={handlePress} type="text" placeholder='Press enter after every tag' />
            </div>
            <br />
            {
                tagArray.length == 0 ?
                    <>
                    </>
                    :
                    <>
                        <div className='tags'>
                            {
                                tagArray.map((e) => {
                                    return (
                                        <>
                                            <div className='tagComp' style={{ marginLeft: "10px" }}>
                                                <div style={{ marginLeft: "10px" }}>{e}</div>
                                                <div onClick={() => { removeTag(e) }} className='removeTag' >❌</div>
                                            </div>
                                        </>
                                    )
                                })
                            }
                        </div>
                        <br />
                    </>
            }
            <div>
                <button onClick={Analyse}>
                    {
                        !isAnalysing ? 
                        <>
                            Analyse
                        </>
                        :
                        <>
                            Analysing.. .  ✨✨                         
                        </>
                    }
                </button>
            </div>
            <br />
            <div className="email-list">
                {emails.length === 0 && find ? (
                    <div class="loader"></div>
                ) : (
                    <ul>
                        {emails.map((e, index) => (
                            <span key={index} >
                                <div className="email-card">
                                    <span>FROM : {e.sender}</span>
                                    <br />
                                    <br />
                                    <div>{index + 1}. {e.body}</div>
                                    <br />
                                    <a
                                        href={`https://mail.google.com/mail/u/0/#inbox/${e.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer">
                                        Open in Gmail
                                    </a>
                                </div>
                                <br />
                            </span>
                        ))}
                    </ul>
                )}
            </div>



            <div>
                {isArray && mailBasedOnTags.length !== 0 ? (
                    <ul className='promptResult'>
                        <h3>Tag Related Mails</h3>
                        <div className='closeButton' onClick={handelWindowClose} ref={windowClose}>❌</div>
                        {mailBasedOnTags.map((e, index) => (
                            <span key={index} >
                                <div className="email-card1">
                                    <span>FROM : {e.sender}</span>
                                    <br />
                                    <br />
                                    <div>{e.body}</div>
                                    <br />
                                    <a
                                        href={`https://mail.google.com/mail/u/0/#inbox/${e.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer">
                                        Open in Gmail
                                    </a>
                                </div>
                                <br />
                            </span>
                        ))}
                    </ul>
                ) : (
                    <></>
                )}
            </div>

        </div>
    );
};

export default Test;