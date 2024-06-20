import emailjs from "@emailjs/browser";
import EmailLogo from "../assets/email.svg";
import  "../styles/SendCaptures.css";

export default function SendCaptures({ attachments }) {
  const sendEmail = (event) => {
    event.preventDefault();

    const HTMLStringStart = "<div>";
    const HTMLString = attachments
      .map((a) => `<img style="width: 400px; height: 300px" src="${a.url}"/>`)
      .join();
    const HTMLStringEnd = HTMLStringStart.concat(HTMLString, "</div>");

    const templateParams = {
      my_html: HTMLStringEnd,
    };

    emailjs
      .send("service_e8v4iqm", "template_c2202es", templateParams, {
        publicKey: "hantp-Q3_fNMiDDIV",
      })
      .then(() => console.log("Email send"))
      .catch((error) => console.log("Failed to send email", error));
  };

  return (
    <>
      <form onSubmit={sendEmail}>
        <button id="email-button" disabled={attachments.length < 1}>
          <img src={EmailLogo} />
        </button>
      </form>
    </>
  );
}
