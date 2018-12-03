/* 
 * Functions for handling data 
 *
 */
var currSubset = null;
var keywords = [];
var startDate = null;
var endDate = null;
var assignees = [];
var inventors = [];

// Authentication Method 
function onClientLoadHandler() {
  // authenticate to BigQuery, it asks for your Google credential to perform oauth
  var config = {
    'client_id': '1001245404093-qma4s3nbj518ndajlekiin7501mh1o62.apps.googleusercontent.com', 
    'scope': 'https://www.googleapis.com/auth/bigquery'
  };
  setTimeout(function() {
    gapi.client.load('bigquery', 'v2', function() {
      gapi.auth.authorize(config, function() {
        console.log("user authenticated");
      });
    });
  }, 3000);
}

// Compose query to refresh the data
function refreshQuery() {
  console.log("refreshing query");
  var i=0;
  var addKey = false; var addIn = false; addAssignee = false;
  if (keywords.length > 0 ) { addKey=true; } 
  if (assignees.length>0) { addAssignee =true; }
  if(inventors.length>0){ addIn = true; }

  var query = "SELECT * FROM [patentsearchdata.filtered] ";

  // add keyword query
  for (i=0; i<keywords.length; i++) {
    if (i==0) { query += "WHERE "; }
    query += "Lower([title]) LIKE '%" + keywords[i] + "%'";
    if (i!=keywords.length-1) { query += " OR "}
  }
  if (addKey) {  
    if (addIn) { query += " OR "; }
  }
  
  // add inventor query
  for (i=0; i<inventors.length; i++) {
    query += "Lower([inventor_name]) LIKE '%" + inventors[i] + "%'";
    if (i!=inventors.length-1) { query += " OR "}
  }

  // add assignee query
  if ( (addKey || addIn) && addAssignee ) { query += " OR "; }
  for (i=0; i<assignees.length; i++) {
    query += "Lower([assignee_name]) LIKE '%" + assignees[i] + "%'";
    if (i!=assignees.length-1) { query += " OR "}
  }

  query += " LIMIT 100;"

  var request = gapi.client.bigquery.jobs.query({
    'projectId': "patent-search-224318",
    'timeoutMs': '50000',
    'query': query
  });
  request.execute(function(response) {
    console.log(response.rows);
    currSubset = response.rows;
    console.log(currSubset.length);
    console.log(currSubset[0]);
  });
}
// "SELECT * FROM [patentsearchdata.filtered] \
//                  WHERE ( LOWER([title]) LIKE '%" + keywords[0] + "%' OR LOWER([title]) LIKE '%" + keywords[1] + "%' ) \
//                  AND LOWER([inventor_name]) LIKE '%" + inventors[0] + "%' \
//                  LIMIT 100;"

function addSearchKeyword(keywordIn) {
  keywords.push(keywordIn);
}

function removeSearchKeyword(remKeys) {
  keywords = remKeys;
  console.log(keywords);
}

function addInventorName(inventorIn) {
  inventors.push(inventorIn);
}

function removeInventorName(remInventors) {
  inventors = remInventors;
  console.log(inventors);
}

function addAssigneeName(assigneeIn) {
  assignees.push(assigneeIn);
}

function removeAssigneeName(remAssignee) {
  assignees = remAssignee;
  console.log(assignees);
}

// function searchAssigneeName(assigneeName) {
//   if (currSubset == null) {
//     var request = gapi.client.bigquery.jobs.query({
//       'projectId': "patent-search-224318",
//       'timeoutMs': '50000',
//       'query': "SELECT * FROM [patentsearchdata.filtered] \
//                          WHERE [assignee_name] \
//                          LIKE '%" + assigneeName + "%' \
//                          LIMIT 100;"
//     });
//     request.execute(function(response) {
//       console.log(response.rows);
//       currSubset = response.rows;
//     });
//   } else {

//   }
// }