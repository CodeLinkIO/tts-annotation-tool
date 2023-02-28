# **Hal Vinyl**

This project is for uploading and annotating audio. These annotated audios will be provided for AI-BE to learn and create new reading voices.

## **Setting up project locally:**

This section will guild you to installing necessary items and how to run the whole app from the root folder instead of running the web and the firebase separately.
If you want to run it separately you can look at these docs:

- [Web](/web/README.md)
- [Firebase](/functions/README.md)

### **_Requirement:_**

- Node 16
- Firebase CLI.

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

### **_Config Web local ENV:_**

Env variables will be shared among the team members. To get access to the ENV please ask your teammate.

After getting the ENV variable, go to the web folder (`$ cd web`), create a `.env` file, and put all the ENV variables to it.

### **_Install packages:_**

In the root folder run:

```
$ yarn install:app
```

### **_Build Firebase functions:_**

In the root folder run:

```
$ yarn firebase:build
```

### **_Init Firebase emulators:_**

In the root folder run:

```
$ cd functions
$ yarn firebase:emulators-init
```

_Note:_ The firebase will as you to select an emulator. Just press enter and confirm. Everything has already been configured.

### **_Get firebase config from server(Optional):_**

This one will get you the config variables of firebase functions. This is required for some feature to run and connect to BE and prevent app crash. Currently, it is not necessary to run.

In the root folder run:

```
$ cd functions
$ yarn firebase:get-config
```

### **_Run the app on localhost:_**

In root folder run:

```
$ yarn start
```

### **_Kill firebase emulators trailing port:_**

Sometimes when quitting emulators some emulators won't quit as we expected. In order to re-run the emulators we will ne to kill the trailing port. You can run:

```
$ yarn firebase:kill-trailing-emulators
```
