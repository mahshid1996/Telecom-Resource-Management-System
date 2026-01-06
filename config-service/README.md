# How to Run the Project

## 1. **Install Dependencies**

npm install


## 2. **Run the App (Locally)**

**If you use the new structure with `server.js`:**

node src/server.js

- The REST API will be available at: [http://localhost:3030/master-config](http://localhost:3030/master-config)
- Swagger docs: [http://localhost:3030/api-docs](http://localhost:3030/api-docs)



sample data
{
  "name": "Email Notification Config",
  "description": "Email Notification Config",
  "type": "NotificationConfig",
  "baseType": "notificationConfig",
  "status": "Active",
  "configCharacteristics": [
    {
      "name": "emailList",
      "code": "emailList",
      "valueType": "array",
      "configCharacteristicsValues": [
        {
          "valueType": "array",
          "value": ["test@gmail.com","testsadsad@gmail.com","test54545@gmail.com"]
        }
      ]
    }
  ],
  "relatedParty": [
    { "name": "drmuser", "email": "", "phone": "" }
  ],
  "attachment": [],
  "code": "CF18",
  "version": 0
}

--------------------------------------------------
{
  "name": "LogicalResource Policy",
  "description": "LogicalResource Policy",
  "type": "Policy",
  "baseType": "resourceInventoryConfig",
  "status": "Active",
  "configCharacteristics": [
    {
      "name": "transitions",
      "code": "transitions",
      "valueType": "array",
      "configCharacteristicsValues": [
        {
          "valueType": "array",
          "value": [
            { "from": "Created", "to": "Available" },
            { "from": "Available", "to": "Blocked" }
          ]
        }
      ]
    }
  ],
  "relatedParty": [
    { "name": "drmuser", "email": "", "phone": "" }
  ],
  "attachment": [],
  "code": "CF17",
  "version": 0
}



queries for get method
http://localhost:3030/master-config?name=LogicalResource Policy&type=Policy
http://localhost:3030/master-config?name=physical Resource Policy
http://localhost:3030/master-config?status=Active
http://localhost:3030/master-config?name=physical Resource Policy&status=Active&type=Policy
http://localhost:3030/master-config




swager:
http://localhost:3030/api-docs/#/default/post_master_config