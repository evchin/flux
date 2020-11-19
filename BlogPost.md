# Fighting Climate Change with Azure Functions

When starting out with small simple projects, it's easy to feel discouraged by how insignificant their impact might seem. But in this project, I tried my hand at keeping it simple, while tackling a bigger problem: climate change.

Flux aims to reduce a user's carbon footprint and mitigate fluctuations in demand by periodically informing them of their regional power grid's demand through SMS text messaging. I'll be showing you how to build this out yourself so you can decrease your carbon footprint too.

## Prerequisites

1. An [Azure Subscription](https://azure.microsoft.com/en-us/free/) (can be created for free)
2. A [Twilio account](https://www.twilio.com/) (can be created for free)
3. [Visual Studio Code](https://code.visualstudio.com/) with the *Azure Static Web Apps (Preview)* extension installed

## Overview: How Flux Works

![a chart of flux's workflow](https://raw.githubusercontent.com/thearchitectsnotebook/portfolio/33cf8eb28e559ce97bcceab8f1f70a1c416e2e02/img/flux/how-it-works.svg)

1. Azure Static Web Apps hosts a remote website that takes in basic user data through an HTML5 form.
2. Azure Cosmos Databases receives and stores the inputted data as a document.
3. The Azure Function periodically shoots a signal every hour to request power demand data from the U.S. Energy Information Administration API, and returns it to the Function.
4. The Function calculates the quartiles of the average demand over the past 24 hours, and determines if the most recent demand data is an anomaly.
5. If the demand from the previous hour is considered an outlier AND a change from the previous demand state, the Azure Function will send the message to the Twilio API.
6. Finally, Twilio accepts the array of messages for each user and sends them to each mobile number.

If you want to see what your code will look like in the end, check out [my Github repo `flux`](github.com/thearchitectsnotebook/flux/)!

## Setting Up Databases

First, we'll use Azure Cosmos Databases to store users' names, phone numbers, and states/regions. 

1. [Create a Cosmos DB account](https://docs.microsoft.com/en-us/azure/cosmos-db/create-cosmosdb-resources-portal) from the Azure Portal.

2. [Create a database and a container.](https://docs.microsoft.com/en-us/azure/cosmos-db/create-cosmosdb-resources-portal#add-a-database-and-a-container) Make sure to set the partition key to `/region`.

3. [Add an item](https://docs.microsoft.com/en-us/azure/cosmos-db/create-cosmosdb-resources-portal#add-data-to-your-database) to your database - we'll use this for testing out our Azure Function later on. Make sure your item follows the following format, with an ID, first name, last name, phone number, US state, and recent demand (this will be explained later on):

```json
{
    "id": "1",
    "first": "YourFirstName",
    "last": "YourLastName",
    "number": "1234567890", // this should be your actual number for testing purposes. the number does not require a country code, as Flux only operates in the US
    "region": "StateYouLiveIn",
    "recentDemand": "neutral"
}
```

## Setting Up Azure Function App and Function

First, [create an Azure Function app](https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-scheduled-function#create-an-azure-function-app) through the Azure portal. Be sure to select Node.js, unless you plan on translating my code into a separate programming language of your choice.

Then, we need to set up app keys for the Twilio API.
1. [Create a new project](https://support.twilio.com/hc/en-us/articles/360011177133-View-and-Create-New-Projects-in-Twilio-Console) on Twilio.
2. [Add a brand new number](https://support.twilio.com/hc/en-us/articles/360019485393-Add-and-Configure-a-New-Phone-Number-with-Twilio-Flex) for your Twilio project, which will be used to send texts to users. Save this to use for later.
3. Go to the dashboard of your Twilio project, and in the **Project Info** section, you should see **Account SID** and **Auth Token**. We will save these as app keys in our Azure Function App.
   ![alt text goes here](https://github.com/thearchitectsnotebook/flux/blob/master/public/images/twilio-keys.PNG?raw=true)
4. Navigate to your Azure Function App page, and go to **App keys** underneath **Functions** on the left bar. Add two **New host keys**. 
   - Name: `TwilioAccountSid`, Value: `YOUR_ACCOUNT_SID` 
   - Name: `TwilioAuthToken`, Value: `YOUR_AUTH_TOKEN`
5. Your app host keys should now look like:  
   ![host keys](https://github.com/thearchitectsnotebook/flux/blob/master/public/images/host-keys.PNG?raw=true)

Now that your keys are set up, scroll down the left activity bar until you find **Console** under **Development Tools**. Click **Console**.  
In the console, enter the command `npm install node-fetch`. We'll use this to send out our API requests.

Once that command finishes executing, scroll back up in the sidebar until you find **Functions** underneath **Functions**.
   
In your new function app, [create a scheduled function](https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-scheduled-function#create-a-timer-triggered-function) that is triggered by a timer.  
For the schedule value, use '0 6 * * * *'. This will cause the function to go off every hour at the sixth minute. This is because the API we will be drawing data from will be updated every hour at the *fifth* minute. Your schedule input should look like:  
   ![a screenshot of the schedule trigger](https://github.com/thearchitectsnotebook/flux/blob/master/public/images/schedule-trigger.PNG?raw=true)
   
Once you've created your new function within your function app, go to the Function page. Click on **Code + Test** on the left hand activity bar under **Developer**. There, you will find some demo code; delete all of it.

## Setting Up Integration with Azure Function

We won't be coding yet - we first need to add in the proper inputs and outputs of our Azure Function.

First, navigate to the **Integration** tab on the left activity bar, and you should see a flow chart with boxes similar to this (though it may be formatted differently):  
   ![a screenshot of the function's timer update](https://docs.microsoft.com/en-us/azure/azure-functions/media/functions-create-scheduled-function/function-update-timer-schedule.png)

Let's go ahead and add **Cosmos DB** to our **Inputs**.

   1. The **Document parameter name** will be how you refer to your database in your code.
      - I use the name `users` , and although you can name your database differently, you must manually adjust the code later to reflect your database name.
   2. For **Database name** and **Collection name**, *use the same names you used when you created your databases.* 
   3. Connect your **Cosmos DB account connection** to your Azure Cosmos DB account.
   4. Leave out the rest of the values; they are optional. 

Your input should look something like this:  
      ![a screenshot of Cosmos as the Function's input](https://github.com/thearchitectsnotebook/flux/blob/master/public/images/cosmos-input.PNG?raw=true)

Next, we'll add **Twilio SMS** to our **Outputs**.

   1. Choose **Twilio SMS** as your **Binding Type**.
   2. Similar to **Document parameter name**, the **Message parameter name** will be how you refer to your messages in your code. 
      - I use `message`, and although you can name it whatever you'd like, you'll need to adjust the code later to reflect your message name.
   3. Now we will use the app keys we set up before. In **Account SID setting**, enter `TwilioAccountSid`.
   4. In **Auth Token setting**, enter `TwilioAuthToken`.
   5. In **From number**, enter the Twilio number you created from before.

Your output should look like this:
      ![Twilio as ouptut of Azure Function](https://github.com/thearchitectsnotebook/flux/blob/master/public/images/twilio-output.PNG?raw=true)

Finally, add **Azure Cosmos DB (outputDocument)** to your **Outputs**.

   1. Choose **Azure Cosmos DB** as your **Binding Type**.
   2. Again, **Document parameter name** will be how you refer to your output item to the database in your code. I use `outputDocument`.
   3. For **Database name** and **Collection name**, *use the same names you used when you created your databases.* 
   4. Make sure the **If true, creates the Cosmos DB database and collection...** option is set to **No**.
   5. Connect your Cosmos DB account.
   6. Set the partition key to `/region`.

Your output should look like this:
      ![Cosmos DB as Function's output](https://github.com/thearchitectsnotebook/flux/blob/master/public/images/cosmos-output.PNG?raw=true)

And with that, we're finally done integration! Here's what your flow chart should look like:
   ![A screenshot of the final flowchart](https://github.com/thearchitectsnotebook/flux/blob/master/public/images/flow-chart-after.PNG?raw=true)

Now, we can finally begin coding. 

## Getting Your API Key

Sorry, just kidding. You first need to grab your own personal API key from the [EIA's developer page](https://www.eia.gov/opendata/register.php). Register with your email address, and you will get an email with your API key. Save this in a safe location.

Okay, *now* we begin coding.

## Coding Core Functionality

First, let's instantiate `npm-fetch` so we can use it later on.

```javascript
var fetch = require("node-fetch");
```

We'll need to be able to get the correct API data codes to each state. This can be a real pain, but fortunately I've already done the tedious work for us. Below is a dictionary of state codes so that we can reference a code for the user's state. Go ahead and copy this into your azure function.

```javascript
var stateCodes = new Object();
stateCodes['CAL'] = ['California']
stateCodes['TEX'] = ['Texas']
stateCodes['CENT'] = ['Nebraska', 'Oklahoma', 'Kansas']
stateCodes['FLA'] = ['Florida']
stateCodes['MIDW'] = ['Illinois', 'Indiana', 'Michigan', 'North Dakota', 'Wisconsin', 'South Dakota', 'Missouri', 'Minnesota', 'Iowa', 'Arkansas', 'Louisiana']
stateCodes['NY'] = ['New York']
stateCodes['CAR'] = ['North Carolina', 'South Carolina']
stateCodes['MIDA'] = ['Maryland', 'Massachusetts', 'Pennsylvania', 'Virginia', 'West Virginia', 'Ohio', 'New Jersey', 'District of Columbia']
stateCodes['NE'] = ['Connecticut', 'Delaware', 'Maine', 'Rhode Island', 'New Hampshire', 'Vermont']
stateCodes['NW'] = ['Nevada', 'Oregon', 'Washington', 'Montana', 'Idaho', 'Colorado', 'Wyoming', 'Utah']
stateCodes['SE'] = ['Georgia', 'Mississippi', 'Alabama']
stateCodes['SW'] = ['Arizona', 'New Mexico']
stateCodes['TEN'] = ['Tennessee', 'Kentucky']
```

Now, we're ready to use our API key to get a specified number of power demand values of a state. 

Let's define an asynchronous function `getDemand`, with parameters `state` to specify a user's location and `numPoints` to specify how many values of demand we want to get.

First, we try and get the user's `stateCode` given their location.

```javascript
async function getDemand(state, numPoints) {
    const apiKey = 'YOUR_API_KEY';
    const uriBase = 'http://api.eia.gov/series/?';

    // find the state code
    var stateCode;
    var found = false;
    for (const [code, states] of Object.entries(stateCodes)) {
        for (var s of states) {
            if (state == s) {
                stateCode = code;
                found = true;
                break;
            }
        }
        if (found) break;
    }

    // if we can't find the state code, alert user
    if (!found) return "Oops! This application currently only supports the lower 48 states of the USA. Check back in later for international support!";
```

Then, we'll set up the parameters for our API request.
```javascript
       // this sequence of characters tells the API that we want power demand for a certain state 
       var seriesID = 'EBA.' + stateCode + '-ALL.D.HL';
   
       // setting up parameters for API request
       let params = new URLSearchParams({
           'series_id': seriesID,
           'api_key': apiKey,
           'num': numPoints,
       })
```

And finally, we'll send our request and get an array of demand values.
```javascript
    // getting the demand values from the API endpoint
    let resp = await fetch(uriBase + params.toString(), {
        method: 'GET'
    })

    // return array of demand values
    let data = await resp.json();
    return data.series[0].data;
}
```

Now that we can get demand, the next step would be to define a function that takes in the data and informs us of whether or not to send the text to the user. 

However, to do so, we need to be able to sense anomalies in demand. I used the [Interquartile Range Rule](https://www.thoughtco.com/what-is-the-interquartile-range-rule-3126244) - but to use it, we need to first find the quartiles of the demand. 

So we can define the `getQuartiles` function that takes in a list of values and returns an array of length 5 that contains, in order: `min, q1, q2, q3, max`.

First, let's clean (by removing unnecessary items) and sort our data.

```javascript
function getQuartiles(list) {
    var cleanedList = [];
    var q1, q2, q3;

    // cleans up list of demand values by removing extraneous data
    for (var o of list) {
        cleanedList.push(o[1]);
    }
    cleanedList.sort(); // sorted list needed to find quartiles
```

Using math from the link above, we can then calculate the quartile ranges.

```javascript
 var n = cleanedList.length;
 if (n % 4 == 0) {
     q2 = (cleanedList[n/2] + cleanedList[n/2-1]) / 2;
     q1 = cleanedList[n/4-1];
     q3 = cleanedList[n/4 * 3];
 } else if (n % 4 == 1) {
     q2 = cleanedList[Math.floor(n/2)];
     q1 = (cleanedList[Math.floor(n/4)] + cleanedList[Math.floor(n/4) - 1]) / 2;
     q3 = (cleanedList[Math.floor(n/4) * 3] + cleanedList[Math.floor(n/4) * 3 + 1]) / 2;
 } else if (n % 4 == 2) {
     q2 = (cleanedList[n/2] + cleanedList[n/2 + 1]) / 2;
     q1 = (cleanedList[Math.floor(n/4)] + cleanedList[Math.floor(n/4) - 1]) / 2;
     q3 = (cleanedList[Math.floor(n/4) * 3 + 1] + cleanedList[Math.floor(n/4) * 3 + 2]) / 2;
 } else {
     q2 = cleanedList[Math.floor(n/2)];
     q1 = cleanedList[Math.floor(n/4)];
     q3 = cleanedList[Math.floor(n/4) * 3 + 2];
 }

 // return list of quartiles
 return [cleanedList[0], q1, q2, q3, cleanedList[n-1]];
}
```

Now we can define that function that tells us whether or not to send a text. More specifically, we can define a function `sendText` that takes in a list of demand values, the most *recent* demand value from that list (not needed but the way I coded it), the user's first name for message customization, and a variable called `recentDemand` which is the *last* state of the user's local demand. 

`recentDemand` will tell us if there has been any change since the last time the API was called - if there *has* been a change, we will send the text to update the user. If not, we won't.

`sendText` will then output an array of values: a boolean that tells us whether or not to send the text, the message to be sent if we send it, and the new value that `recentDemand` should be updated to.

```javascript
async function sendText(demand, currentDemand, firstName, recentDemand) {
    // get the quartiles
    var quartiles = getQuartiles(demand);

    // if current demand is higher than usual and the user's state does not reflect that, send text
    if (currentDemand > quartiles[3] && recentDemand != "over") 
        return [true, "Hi " + firstName + ". There is high demand for power right now! Try to power down if you can. :)", "over"];
    // if current demand is lower than usual and the user's state does not reflect that, send text
    else if (currentDemand < quartiles[1] && recentDemand != "under") 
        return [true, "Hi " + firstName + ". Power demand is low right now! You can turn your power on guilt-free. :D", "under"];
    // if current demand was fluctuating but is now back to normal, send text
    else if (!currentDemand < quartiles[1] && !currentDemand > quartiles[3] && recentDemand != "neutral") 
        return [true, "Hi " + firstName + ". Power demand is neutral right now.", "neutral"];
    // else, don't send a text
    return [false, "Hi " + firstName + ". No changes in power demand have been made.", recentDemand];
}
```

Now comes our main function that puts all of the pieces together.

```javascript
module.exports = async function (context, req) {
    // get users from cosmos database
    var users = context.bindings.users; 
    // list of messages to be sent
    context.bindings.message = [];

    // loop through each user
    for (var i = 0; i < users.length; i++) {
        var mobileNumber = users[i].number; // get user's number
        var demand = await getDemand(users[i].region, 24); // get demand in user's state
        var currentDemand = demand[0][1]; // get most recent demand from demand 
        var result = await sendText(demand, currentDemand, users[i].first, users[i].recentDemand); // send?
        var msg;

        // if sending text,
        if (result[0]) {
            // take the message from outputted result
            msg = result[1] 
            // update the user's recentDemand state
            context.bindings.outputDocument = users[i]; 
            context.bindings.outputDocument.recentDemand = result[2];
            // create an object with the user's message and number
            var obj = {
                body: msg,
                to: mobileNumber
            };
            // add the object to the list of messages
            context.bindings.message.push(obj);
        }
    }
}
```

And that's it! We've successfully coded our Function.

## Setting up the Frontend

Finally, we'll create the website used to take in user information through a simple HTML form. 

I used React.js to create my frontend, because I plan to expand Flux to include additional features that will require more functionality and flexibility. However, this is not necessary - if you only wish to create the basic form, you can use vanilla JS.

1. Open Visual Studio Code and [create a new React app](https://reactjs.org/docs/create-a-new-react-app.html).
2. Once you're set up, navigate to your `src` folder.
3. Create the file `config.js` in `src`. This will set up configuration to connect to our Cosmos databases. 
4. Navigate to your Azure Cosmos Databases Account page. Underneath the **Settings** tab in the left bar, select **Keys**. Copy your primary key. Then, navigate back to your `config.js` and input your own values into the `config` object below.

```javascript
const config = {
  endpoint: "https://YOUR_DATABASE_ACCOUNT_NAME.documents.azure.com:443/",
  key: "YOUR_PRIMARY_KEY",
  databaseId: "YOUR_DATABASE_NAME",
  containerId: "YOUR_CONTAINER_NAME",
  partitionKey: {kind: "Hash", paths: ["/region"]}
};
module.exports = config;
```

5. Next, create a file `databaseContext.js` in `src`. This will contain a single function `create` that ensures our database is created if it doesn't exist for whatever reason, and essentially just confirms we have the user's data. Copy the following code into your file.

```javascript
const config = require("./config"); // import configuration from config file 
const CosmosClient = require("@azure/cosmos").CosmosClient;

async function create(client, databaseId, containerId) {
   const partitionKey = config.partitionKey;

    const { database } = await client.databases.createIfNotExists({
        id: databaseId
    });

    const { container } = await client
        .database(databaseId)
        .containers.createIfNotExists(
            { id: containerId, partitionKey },
            { offerThroughput: 400 }
    );
}

export default create;
```

Now that we have our account linked to our React app, let's start coding the app!

## Coding the Frontend

Let's start by importing the `React` and the `create` function we made earlier, and initializing our Cosmos Client and config.

```javascript
import React from 'react'
import create from './databaseContext'
const CosmosClient = require("@azure/cosmos").CosmosClient;
const config = require("./config");
```

To have some form authentication to make sure we're not getting incorrect data, we'll need an array of states to make sure users don't input their data in wrong.

```javascript
const states = ["Alaska",
                "Alabama",
                "Arkansas",
                "American Samoa",
                "Arizona",
                "California",
                "Colorado",
                "Connecticut",
                "District of Columbia",
                "Delaware",
                "Florida",
                "Georgia",
                "Guam",
                "Hawaii",
                "Iowa",
                "Idaho",
                "Illinois",
                "Indiana",
                "Kansas",
                "Kentucky",
                "Louisiana",
                "Massachusetts",
                "Maryland",
                "Maine",
                "Michigan",
                "Minnesota",
                "Missouri",
                "Mississippi",
                "Montana",
                "North Carolina",
                "North Dakota",
                "Nebraska",
                "New Hampshire",
                "New Jersey",
                "New Mexico",
                "Nevada",
                "New York",
                "Ohio",
                "Oklahoma",
                "Oregon",
                "Pennsylvania",
                "Puerto Rico",
                "Rhode Island",
                "South Carolina",
                "South Dakota",
                "Tennessee",
                "Texas",
                "Utah",
                "Virginia",
                "Virgin Islands",
                "Vermont",
                "Washington",
                "Wisconsin",
                "West Virginia",
                "Wyoming"]
```

We'll first create an asynchronous function `createUser` that will store the user's information in Cosmos.

```javascript
async function createUser(first, last, number, region, recentDemand) {
  var { endpoint, key, databaseId, containerId } = config;
  const client = new CosmosClient({endpoint, key});
  const container = database.container(containerId);

  await create(client, databaseId, containerId);

  const newItem = {
      first: first,
      last: last,
      number: number,
      region: region,
      recentDemand: recentDemand
  };

  try {
      const {resource: createdItem} = await container.items.create(newItem);
  } catch (err) {
      console.log(err.message);
  }
}
```

Then, we'll create the component `User` that will ultimately display the form in the website.

```javascript
class User extends React.Component {
   ...
}
```

Inside the `User` class, we'll make the constructor that initializes our user's states and variables. 

```javascript
constructor(props) {
    super(props);
    this.state = {
      first: "",
      last: "",
      number: "",
      region: "",
      recentDemand: ""
    };
    this.state.recentDemand = "neutral"; // initialize recentDemand to a value of "neutral"
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
}
```

The `User` class also needs a method `handleInputChange` to change user states to the input in the form.

```javascript
handleInputChange(event) {
    const target = event.target;
    const value = target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
}
```

We'll also need to create the method `handleSubmit` for the `User` class to handle form submission events.  
Notice how we want to prevent the default event of refreshing the browser page, and we create the user *only* if the form meets our authentication restrictions.

```javascript
handleSubmit(event) {
    if (this.state.first === "" || this.state.last === "" || this.state.number === "" || this.state.region === "") {
      alert("Please fill out all fields.")
      event.preventDefault();
    } else if(!states.includes(this.state.region)) {
      alert("Please enter a valid state.")
      event.preventDefault();
    } else {
      alert ("Hey there, " + this.state.first + ". Thanks for signing up. You've just taken a step towards creating a greener future.");
      event.preventDefault();
      createUser(this.state.first, this.state.last, this.state.number, this.state.region, this.state.recentDemand);
    }
}
```

Finally, we'll create our `render` method inside the `User` class to render our form out.

```JSX
render() {
    return (
      <form autoComplete="off" onSubmit={this.handleSubmit} className="form">
          <input type="text" name="first" value={this.state.first} onChange={this.handleInputChange} placeholder="First Name"/>
          <input type="text" name="last" value={this.state.last} onChange={this.handleInputChange} placeholder="Last Name"/>
          <input type="number" name="number" value={this.state.number} onChange={this.handleInputChange} placeholder="Phone Number"/>
          <input type="text" name="region" value={this.state.region} onChange={this.handleInputChange} placeholder="State"/>
          <button type='submit'></button>
          <div className="disclaimer">* For lower 48 US states only.</div>
      </form>
    );
}
```

Now that we're done building the `User` class, we can export it. Type `export default User;` outside of the class `User`.

Navigate to your `index.js` file. Clear its contents, and import the `User` component using the following code.

```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import User from './App';

ReactDOM.render(<User />, document.getElementById('root'));
```

Finally, go to the `index.html` file in the `public` folder. 

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Bringing balance to the flux of power demand."/>
    <title>Flux</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <!--
      To begin the development, run `npm start`.
      To create a production bundle, use `npm run build`.
    -->
  </body>
</html>
```

Beyond this, you are welcome to customize your HTML file with CSS if you'd like, but that will not be covered in this tutorial.

## Deployment with Azure Static Web Apps

**Note**: This section assumes you already have Visual Studio Code with the *Azure Static Web Apps (Preview)* extension installed, as mentioned in the prerequisites. If you do not, please go do so now.

To deploy your web app, follow the instructions to:
1. [Create a static web app](https://docs.microsoft.com/en-us/azure/static-web-apps/getting-started?tabs=react#create-a-static-web-app) in VSCode.
2. [View your newly deployed website](https://docs.microsoft.com/en-us/azure/static-web-apps/getting-started?tabs=react#view-the-website)!

Here's what [mine](https://flux.thearchitectsnotebook.com) looks like right now:
![](https://github.com/thearchitectsnotebook/flux/blob/master/public/images/final-flux.PNG?raw=true)

That was a lot, but you got through it! A congratulations is in order - you're taking a tiny step towards conquering climate change.

Some additional features you can try out:
1. Add charts of power demand
2. Expand service to the outside of the US
3. Rewrite the algorithm for finding anomalies
4. Make power demand more local - ie instead of finding power demand for each state, find it for each utility region
