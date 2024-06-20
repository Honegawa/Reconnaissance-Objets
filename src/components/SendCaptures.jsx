import emailjs from "@emailjs/browser";

export default function SendCaptures({ attachments }) {
  const sendEmail = (event) => {
    event.preventDefault();

    const HTMLStringStart = "<div>";
    const HTMLString = attachments
      .map((a) => `<img style="width: 400px; height: 300px" src="${a}"/>`)
      .join();
    const HTMLStringEnd = HTMLStringStart.concat(HTMLString, "</div>");

    const templateParams = {
      my_html: HTMLStringEnd,
    };

    console.log(attachments, templateParams);

    emailjs
      .send("service_e8v4iqm", "template_c2202es", templateParams, {publicKey: "hantp-Q3_fNMiDDIV"})
      .then(() => console.log("Email send"))
      .catch((error) => console.log("Failed to send email", error));
  };

  return (
    <>
      <form onSubmit={sendEmail}>
        <button>Envoyer</button>
      </form>
    </>
  );
}
