# Hal Vinyl Firebase

Firebase is used to get data and integrate with BE using functions

### **_Requirement:_**

- Node 16
- Firebase CLI

### **_Installing Firebase CLI:_**

Before running the app locally, you will need to install firebase CLI and log in to your firebase account using the CLI.

<sup>To Install Firebase CLI run

```
$ npm install -g firebase-tools
```

</sup>

<sup>Login to CLI

```
$ firebase login
```

</sup>

### **_Install packages:_**

Run:

```
$ yarn
```

### **_Build Firebase functions:_**

Run:

<sub>The script will generate new folder `/lib`</sub>

```
$ yarn build
```

### **_Init Firebase emulators:_**

run:

```
$ yarn firebase:emulators-init
```

_Note:_ The firebase will as you to select an emulator. Just press enter and confirm. Everything has already been configured.

### **_Get firebase config from server:_**

This one will get you the config variables of firebase functions. This is required for some feature to run and connect to BE and prevent app crash.

Run:

```
$ yarn firebase:get-config
```

### **_Firebase run emulators on local:_**

Run:

```
$ yarn firebase-emulators
```

### **_Kill firebase emulators trailing port:_**

Sometimes when quitting emulators some emulators won't quit as we expected. In order to re-run the emulators we will ne to kill the trailing port. You can run:

```
$ yarn emulators:kill-functions
$ yarn emulators:kill-auth
$ yarn emulators:kill-firestore
$ yarn emulators:kill-hosting
$ yarn emulators:kill-storage
$ yarn emulators:kill-database
$ yarn emulators:kill-pubsub
```

### **_Deploy Firebase function:_**

Run:

```
$ yarn deploy
```
