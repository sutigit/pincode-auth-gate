# pincode-auth-gate CLI

A simple Node.js CLI tool for managing app authorization pincodes via Supabase.

## Setup

```bash
# clone the repository
git clone https://github.com/sutigit/pincode-auth-gate.git
cd pincode-auth-gate

# install dependencies
npm install

# build the project
npm run build

```

## Usage

After building run:

```
npm run start

```

You’ll be asked:

Whether to create or change a pincode.

If creating, enter the app name the pincode will be associated with.

If changing, select an app from a list using the arrow keys.

The CLI will change the pincode to that app.

## Example

```
pincode-auth-gate
Create new pincode or change code in existing app? (c = create/e = existing): c
Enter name of the app in which the pincode will be used in: sample-app
| processing
pincode created
app: sample-app
pin: 482917
id: 12
```

## Requirements

- Node.js 18+

- Supabase credentials configured in db.js
