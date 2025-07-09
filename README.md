# Trol
Proof-of-concept tool that lets you spoof requests to Securly to appear as any user.
- **I AM IN NO WAY RESPONSIBLE FOR THE TROUBLE YOU GET IN OR CAUSE FOR USING THIS TOOL**

## How do I set this up 😡
1. Clone the repository
	1. Make sure you have `git`, `node`, and `npm/pnpm` installed
```sh
$ git clone https://github.com/scaratech/trol
$ cd trol
$ pnpm i # or npm i
```
2. Configuring environment variables
	1. Create a file called `.env` and put in this contents
```env
PORT=3000 # Port for the server to run on
MASTER_TOKEN="1234" # The "master token" lets you view logs and create "user tokens"
```
3. Modify `src/config.ts`
```ts
export const config = {
    "cluster": "", // The cluster domain, you can find this by going to any blocked site and copying the domain
    "domain": "", // The E-Mail domain (For example lets say we have student@example.com, this would be `example.com`), admittedly this should be removed to instead just provide an E-Mail since not all schools use FIRST_NAME@LAST_NAME@DOMAIN.TLD
    "extenion_id": "", // The ID of the Securly extension you have, there are many different ways to find this
    "extension_version": "", // The version of the Securly extension, you can find this in the extensions manifest
    "search_engine": "" // Search engine for spoofing searches (Ex. https://google.com/search?q=%s)
}
```
4. Build and start the server
```sh
$ pnpm build # or npm run build
$ pnpm start # or npm start
```
### Using the front-end
1. Open `http://localhost:3000` in your browser
2. Enter your "master token" into the correct field, then press "generate token" to get a "user token", then put that token into the correct field (If it wasn't obvious you can delete tokens by pressing "Delete token")
-  The first and last name fields are the first and last name of your target
- "Site URL" is, well, the site you want to think Securly your target is visiting
- "Keyword" is similar expect it will look that search up as your target
- Repeat will send that number of requests
- And well, "send site" and "send keyword" are obvious
- Pressing "view logs" will, well, let you view log
Only people with the master token can:
- Generate tokens
- Delete tokens
- View logs
