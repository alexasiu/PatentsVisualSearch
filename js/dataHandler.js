/*
 * Functions for querying data with BigQuery API
 *
 */
var currSubset = [];
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
  currSubset = []
  var i=0;
  var addKey = false; var addIn = false; addAssignee = false;
  if (keywords.length > 0 ) { addKey=true; }
  if (assignees.length>0) { addAssignee =true; }
  if(inventors.length>0){ addIn = true; }

  var query = "SELECT * FROM [patentsearchdata.filteredFull] ";

  // add keyword query
  for (i=0; i<keywords.length; i++) {
    if (i==0) { query += "WHERE "; }
    query += "Lower([keywords]) LIKE '%" + keywords[i] + "%'";
    if (i!=keywords.length-1) { query += " AND "}
  }
  if (addKey) {
    if (addIn) { query += " AND "; }
  }

  // add inventor query
  for (i=0; i<inventors.length; i++) {
    query += "Lower([inventor_name]) LIKE '%" + inventors[i] + "%'";
    if (i!=inventors.length-1) { query += " AND "}
  }

  // add assignee query
  if ( (addKey || addIn) && addAssignee ) { query += " AND "; }
  for (i=0; i<assignees.length; i++) {
    query += "Lower([assignee_name]) LIKE '%" + assignees[i] + "%'";
    if (i!=assignees.length-1) { query += " AND "}
  }

  query += " LIMIT 100;"

  var request = gapi.client.bigquery.jobs.query({
    'projectId': "patent-search-224318",
    'timeoutMs': '50000',
    'query': query
  });
  request.execute(
    function(response) {
      response.rows.forEach(
        function(d) {
          currSubset.push({
              "id": parseInt(d.f[0].v),
              "title": d.f[1].v,
              "date": d.f[2].v,
              "abstract": d.f[3].v,
              "assignee": d.f[4].v,
              "inventors": d.f[5].v,
              "citations": d.f[6].v,
              "keywords": d.f[7].v,
              "cluster": Math.floor(Math.random() * 2), // TODO change based on keywords  // num should match cluster number
              "radius": 10,                             // TODO set radius based on similarity
              x: Math.random(),
              y: Math.random(),
              px: Math.random(),
              py: Math.random()
            });
        });

      // Assign clusters // TODO 
      var clusterNodes = [ currSubset[0], currSubset[1]  ];

      if (clusterNodes.length > 0) {
        // TODO
        // plot nodes with the data and computed clusters
        plotNodes( currSubset, clusterNodes );
      }

  });

}

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

function getSimilarityScore(patent1, patent2) {
  let p1words = patent1.title + patent1.abstract
  let p2words = patent2.title + patent2.abstract
  let intersection = p1words.filter(word => p2words.includes(word));
  let union = [new Set([p1words, p2words])];
  return float(intersection.length) / float(union.length)
}

function loadCitations(patents) {
  var incitationCount = {} // {patent_id : Int}
  var citationLinks = {} // {patent_id of citing : patent_id of cited}

  let searchResults = patents.keys()

  patents.forEach(function(patent) {
      patent.citations.forEach(function(citation) {
          if (searchResults.contains(citation)) {
            citationLinks[patent.patent_id] = citation
            if (incitationCount.keys().contains(citation)) {
              incitationCount[citation] += 1
            } else {
              incitationCount[citation] = 1
            }
          }
      });
  });

  // TODO: Update node size based on incitationCount
  // TODO: Draw links using citationLinks

}

function returnCluster(n) {

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
