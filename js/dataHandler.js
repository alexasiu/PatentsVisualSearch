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
var clusterM = 5;



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
        document.querySelector('.refreshVizBtn').disabled = false;
      });
    });
  }, 3000);
}

// Compose query to refresh the data
function refreshQuery() {
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

  query += " LIMIT 500;"

  var request = gapi.client.bigquery.jobs.query({
    'projectId': "patent-search-224318",
    'timeoutMs': '50000',
    'query': query
  });

  incitationCount = {}
  citationLinks = {}

  request.execute(
    function(response) {
      if (response == undefined) {console.log(response)};
      citations = loadCitations(response.rows);
      incitationCount = citations[0];
      promises = citations[1];

      Promise.all(promises).then(function(citationLinks) {
        for (i = 0; i < response.rows.length; i++) {
          d = response.rows[i];
          currSubset.push({
              "id": d.f[0].v,
              "title": d.f[1].v,
              "date": d.f[2].v,
              "abstract": d.f[3].v,
              "assignee": d.f[4].v,
              "inventors": d.f[5].v,
              "citations": d.f[6].v,
              "keywords": d.f[7].v,
              "cluster": Math.floor(Math.random() * clusterM),
              "radius": getRadius(incitationCount, d.f[0].v), // TODO set radius based on incitationCount
              // x: parseInt(350),
              // y: 350,
              // px: 350,
              // py: 350,
              opacity: turnDateIntoOpacity(d.f[2].v)
            });
        }

        var clusterNodes = assignClusters(clusterM);
        //var clusterNodes = [currSubset[0],currSubset[1],currSubset[2],currSubset[3]]
        plotNodesAndLinks( currSubset, clusterNodes, citationLinks );
      });

      // incitationCount = citations[0];
      // citationLinks = citations[1];
      //
      // for (i = 0; i < response.rows.length; i++) {
      //   d = response.rows[i];
      //   currSubset.push({
      //       "id": d.f[0].v,
      //       "title": d.f[1].v,
      //       "date": d.f[2].v,
      //       "abstract": d.f[3].v,
      //       "assignee": d.f[4].v,
      //       "inventors": d.f[5].v,
      //       "citations": d.f[6].v,
      //       "keywords": d.f[7].v,
      //       "cluster": Math.floor(Math.random() * clusterM),
      //       "radius": getRadius(incitationCount, d.f[0].v), // TODO set radius based on incitationCount
      //       // x: 350,
      //       // y: 350,
      //       // px: 350,
      //       // py: 350,
      //       opacity: turnDateIntoOpacity(d.f[2].v)
      //     });
      // }
      //
      // var clusterNodes = assignClusters(clusterM);
      // //var clusterNodes = [currSubset[0],currSubset[1],currSubset[2],currSubset[3]]
      // plotNodesAndLinks( currSubset, clusterNodes, citationLinks );

  });

}

function getRadius(incitationCount, patent_id) {
  scaleFactor = 1;
  if (incitationCount[patent_id] != undefined) {
    scaleFactor += incitationCount[patent_id];
  }
  return 10 * scaleFactor;
}

function addSearchKeyword(keywordIn) {
  keywords.push(keywordIn);
}

function removeSearchKeyword(remKeys) {
  keywords = remKeys;
}

function addInventorName(inventorIn) {
  inventors.push(inventorIn);
}

function removeInventorName(remInventors) {
  inventors = remInventors;
}

function addAssigneeName(assigneeIn) {
  assignees.push(assigneeIn);
}

function removeAssigneeName(remAssignee) {
  assignees = remAssignee;
}

function turnDateIntoOpacity(date_data) {
  let patentYear = (new Date(date_data)).getFullYear();
  let currentYear = new Date().getFullYear();
  return Math.min((20 - Math.min(currentYear-patentYear, 20)) / (40) + 0.5, 1.0);
}

function getUnion(set1, set2) {
  var union = new Set();
  for (i = 0; i < set1.length; i++) {
    let w = set1[w];
    union.add(w);
  }
  for (i = 0; i < set2.length; i++) {
    let w = set2[w];
    union.add(w);
  }
  return union;
}

function getIntersection(set1, set2) {
  var intersection = new Set();
  for (i = 0; i < set1.length; i++) {
    let w = set1[w];
    print(w);
    if (set2.has(w)) {
      print("c")
      intersection.add(w);
    }
  }
  return intersection;
}

function getSimilarityScore(patent1, patent2) {
  let p1words = new Set(patent1.f[7].v.split(' '));
  let p2words = new Set(patent2.f[7].v.split(' '));

  var intersection = new Set();

  p1words.forEach(function(w) {
    if (p2words.has(w)) {
      intersection.add(w);
    }
  });

  var union = new Set();
  p1words.forEach(function(w) {
    union.add(w);
  });
  p2words.forEach(function(w) {
    union.add(w);
  });

  return intersection.size / union.size;
}

function updateClusterNumber(sliderValue) {
    clusterM = sliderValue;
}

// function updateCluserNumber(slider) {
//   clusterM = slider+1; // Adjusted for 0 index
// }

function getPatentById(patentId, patents) {
  for (i = 0; i < patents.length; i++) {
    d = patents[i];
    if (d.f[0].v == patentId) {
      return d;
    }
  }
}

function loadCitations(patents) {

  var incitationCount = {}; // {patent_id : Int}
  var citationLinks = []; // {source: patent_id of citing, target: patent_id of cited}

  let searchResults = new Set();

  for (i = 0; i < patents.length; i++) {
    searchResults.add(patents[i].f[0].v);
  }
  count = 0;
  for (i = 0; i < patents.length; i++) {
    patent = patents[i];
    let citations = patent.f[6].v.split(", ");
    for (x = 0; x < citations.length; x++) {
      let citation = citations[x];
      if (searchResults.has(citation)) {
        citationLinks.push({"source": patent.f[0].v, "target": citation, "distance": 0});
        if (Object.keys(incitationCount).includes(citation)) {
          incitationCount[citation] += 1
        } else {
          incitationCount[citation] = 1
        }
      }
    }
  };
  return [incitationCount, getAddLinkDistancePromises(citationLinks, incitationCount, patents)];
}

function getAddLinkDistancePromises(citationLinks, incitationCount, patents) {
  let promises = [];
  let iterLength = citationLinks.length;
  citationLinks.forEach(function(link) {
    promises.push(new Promise(function(resolve, reject) {
      let sourcePatent = getPatentById(link["source"], patents);
      let targetPatent = getPatentById(link["target"], patents);
      link["distance"] = getSimilarityScore(sourcePatent, targetPatent);
      resolve(link);
    }));
  });
  // Promise.all(promises).then(function(newCitationLinks) {
  //   return [incitationCount, newCitationLinks] ;
  // });
  return promises;

  // return new Promise(function(resolve, reject) {
  //   let promises = [];
  //   let iterLength = citationLinks.length;
  //   for (i = 0; i < iterLength; i++) {
  //     console.log(i);
  //     let link = citationLinks[i];
  //     promises.push(new Promise(function(resolve, reject) {
  //       let sourcePatent = getPatentById(link["source"], patents);
  //       let targetPatent = getPatentById(link["target"], patents);
  //       let similarityScore = getSimilarityScore(sourcePatent, targetPatent);
  //       resolve(similarityScore);
  //     }));
  //   }
  //   console.log(promises.length);
  //   Promise.all(promises).then(function(similarityScores) {
  //     console.log(similarityScores);
  //     resolve([incitationCount, citationLinks]);
  //   });
  // });
}

function assignClusters(m) {

  var clusterNodes = [];
  var key_freq = [];
  var val_freq = [];
  var kw_array = [];

  // collect and sort the keywords
  for (var i = 0; i < currSubset.length ; i++) {
    if (currSubset[i].keywords.indexOf(',') > -1) {
      // if there are multiple keywords
      var kws = currSubset[i].keywords.split(",");
      for (var j=0; j<kws.length; j++ ) {
        getSingleCluster( key_freq, val_freq, kw_array, kws[j] );
      }
    } else {
      // if there's only one
      getSingleCluster(key_freq, val_freq, kw_array, currSubset[i].keywords);
    }
  }

  var sort_dic = [];
  for (var i = 0; i < key_freq.length; i ++) {
    sort_dic[i] = [key_freq[i], val_freq[i]];
  }

  // Sort the array based on the second element
  sort_dic.sort(function(first, second) {
    return second[1] - first[1];
  });
  // get top m
  sort_dic_top = sort_dic.slice(0,m-1);

  for (var i = 0; i < currSubset.length ; i++) {
    if (currSubset[i].keywords.indexOf(',') > -1) {
      // if there are multiple keywords
      var kws = currSubset[i].keywords.split(",");
      var clusterNum = getSingleCluster( key_freq, val_freq, kw_array, kws[0] );

      currSubset[i].cluster = itemIn2DArray(clusterNum, sort_dic_top);

      for (var j=1; j<kws.length; j++ ) {
        var clusterNum = getSingleCluster( key_freq, val_freq, kw_array, kws[j] );
        if ( itemIn2DArray(clusterNum, sort_dic_top) > 1 ) {
          currSubset[i].cluster = itemIn2DArray(clusterNum, sort_dic_top);
          break;
        } else if ( j == kws.length-1 ) {
          currSubset[i].cluster = 0;
        }
      }
    } else {
      // if there's only one
      var clusterNum = getSingleCluster(key_freq, val_freq, currSubset[i].keywords);
      currSubset[i].cluster = itemIn2DArray(clusterNum, sort_dic_top);
    }

    clusterNodes[ currSubset[i].cluster ] = currSubset[i];

  }

  return clusterNodes;

}

function itemIn2DArray(item, array) {
  for (var i = 0; i < array.length; i++) {
    if (array[i][0] == item) {
      return i+1;
    }
  }
  return 0;
}

function getSingleCluster( key_freq, val_freq, kw_array, nodeKeyword ) {

  var clusterNum = 0;
  var kw_arr_idx = kw_array.indexOf(nodeKeyword);

  if (kw_arr_idx > -1) {
    clusterNum = kw_arr_idx+2;
    val_freq[key_freq.indexOf(clusterNum)] += 1;
  } else {
    kw_array.push(nodeKeyword);
    clusterNum = kw_array.length+2;
    key_freq.push(clusterNum);
    val_freq.push(1);
  }
  return clusterNum;
}

function copyNode(node) {
  return ({ "id": node.id,
            "title": node.title,
            "date": node.date,
            "abstract": node.abstract,
            "assignee": node.assignee,
            "inventors": node.inventors,
            "citations": node.citations,
            "keywords": node.keywords,
            "cluster": node.cluster,
            "radius": node.radius,
            x: node.x,
            y: node.y,
            px: node.px,
            py: node.py,
            opacity: node.opacity
          });
}
