# cardano-node-juggler (v0.1.0 - alpha)
A local nodejs setup for a Cardano Staking Pool on macOS

## Goal

The goal of this code base is to provide a simple Cardano staking pool monitor and leader switching mechanism.
This is a command line nodejs application that runs jormungandr in the background (keeps running on cnj exit).

## Getting started

### + Homebrew (https://brew.sh/)

brew update\
brew install node\
brew upgrade node

node --version\
(output, eg.: v13.12.0)

cd /path/to/cardano-node-juggler

npm install\
(This will initialize the node project and install axios and color in that project folder.)

### + jormungandr
Find the latest macOS release on GitHub (eg. jormungandr-v0.8.18-x86_64-apple-darwin-generic.tar.gz)\
https://github.com/input-output-hk/jormungandr/releases

Copy both executables, jcli and jormungandr, into the /path/to/cardano-node-juggler/.\
Make them executable, if they aren't (Terminal)

chmod +x jcli\
chmod +x jormungandr

Copy/Paste cnj.config.template.json and name it cnj.config.json\
Edit cnj.config.json to match your local setup and ids etc.

Copy your poolsecret.yaml into /poolsecret/ (added to .gitignore)

Start the cli app in the terminal:

node cnj.js

### + notes

Make sure your ports (eg. 3000 to 3200) are available to the internet and mapped to your machine.\
If you have a static IP, use the nodeconfig.template.publicip.json instead of nodeconfig.template.json.

Also: macOS will prevent jcli and jormungandr from running when you start the app for the first time.

Open Settings > Security and allow jcli and jormungandr. You will need to restart

node cnj.js

several times until you clicked allow for both enough times that even macOS will notice that you want to run those apps.
