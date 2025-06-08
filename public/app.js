async function main() {
    const config = await (await fetch("/config")).json();
    const domain = config.domain;

    const output = document.getElementById("output");

    const log = msg => {
        output.textContent += msg + "\n";
        output.scrollTop = output.scrollHeight;
    };

    const getInput = id => document.getElementById(id).value;
    const setInput = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    };

    setInput("masterToken", localStorage.getItem("masterToken") || "");
    setInput("userToken", localStorage.getItem("userToken") || "");

    ["masterToken", "userToken"].forEach(id => {
        const el = document.getElementById(id);

        el.addEventListener("input", () => {
            localStorage.setItem(id, el.value);
        });
    });

    const createEmail = (fn, ln) => {
        return `${fn}.${ln}@${domain}`;
    }

    const getIP = async () => (await fetch("/ip")).json();

    const headers = () => ({
        "Content-Type": "application/json",
        Authorization: getInput("userToken"),
    });

    const masterHeaders = () => ({
        "Content-Type": "application/json",
        Authorization: getInput("masterToken"),
    });

    document.getElementById("btnGenerateToken").onclick = async () => {
        try {
            const res = await fetch("/api/genToken", {
                method: "POST",
                headers: masterHeaders(),
            });

            if (!res.ok) throw new Error("Failed to generate token");
            const data = await res.json();

            log("Generated Token: " + data.token);
            setInput("userToken", data.token);

            localStorage.setItem("userToken", data.token);
        } catch (err) {
            log(err.message);
        }
    };

    document.getElementById("btnDeleteToken").onclick = async () => {
        try {
            const token = getInput("userToken");

            const res = await fetch("/api/delToken", {
                method: "POST",
                headers: masterHeaders(),
                body: JSON.stringify({ token }),
            });

            if (!res.ok) throw new Error("Failed to delete token");

            log("Deleted token: " + token);
            setInput("userToken", "");

            localStorage.removeItem("userToken");
        } catch (err) {
            log(err.message);
        }
    };

    document.getElementById("btnViewLogs").onclick = async () => {
        try {
            const res = await fetch("/api/logs", {
                headers: masterHeaders(),
            });

            if (!res.ok) throw new Error("Failed to get logs");

            const txt = await res.text();
            const blob = new Blob([txt], { type: "text/plain" });
            const url = URL.createObjectURL(blob);

            window.open(url, "_blank");
            log("Opened logs in new tab");
        } catch (err) {
            log(err.message);
        }
    };

    document.getElementById("btnSendSite").onclick = async () => {
        try {
            const { ip } = await getIP();
            const email = createEmail(getInput("fname"), getInput("lname"));
            const repeat = Number(getInput("repeat"));

            for (let i = 0; i < repeat; i++) {
                const res = await fetch("/api/site", {
                    method: "POST",
                    headers: headers(),
                    body: JSON.stringify({ email, url: getInput("siteUrl"), ip }),
                });

                if (!res.ok) throw new Error(`Failed to send site request #${i + 1}`);
            }
            log(`Sent ${repeat} blocked URL requests`);
        } catch (err) {
            log(err.message);
        }
    };

    document.getElementById("btnSendKeyword").onclick = async () => {
        try {
            const { ip } = await getIP();
            const email = createEmail(getInput("fname"), getInput("lname"));
            const repeat = Number(getInput("repeat"));

            for (let i = 0; i < repeat; i++) {
                const res = await fetch("/api/safesearch", {
                    method: "POST",
                    headers: headers(),
                    body: JSON.stringify({ email, keyword: getInput("keyword"), ip }),
                });

                if (!res.ok) throw new Error(`Failed to send keyword request #${i + 1}`);
            }

            log(`Sent ${repeat} flagged keyword requests`);
        } catch (err) {
            log(err.message);
        }
    };
}

main();