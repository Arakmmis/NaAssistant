(function(){

var characterArray = [];
var characterName;
var characterId;

var energyArray = [];
var greenEnergy = 'https://naruto-arena.net/images/energy/energy_0.gif';
var redEnergy = 'https://naruto-arena.net/images/energy/energy_1.gif';
var blueEnergy = 'https://naruto-arena.net/images/energy/energy_2.gif';
var whiteEnergy = 'https://naruto-arena.net/images/energy/energy_3.gif';
var randomEnergy = 'https://naruto-arena.net/images/energy/energy_4.gif';
var energyText = '';

var promisesInner = [];
var breakLoopMissionInner = [];

var promisesOuter = [];
var breakLoopMissionOuter = [];

var promisesInner2 = [];
var breakLoopChar = false;

var classesText;

var arrayOfCharacterObjects = [];

var helperCounter = 0;

    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules([{
          conditions: [new chrome.declarativeContent.PageStateMatcher({
            pageUrl: {hostEquals: 'naruto-arena.net'},
          })
          ],
              actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);

})
chrome.runtime.onMessage.addListener(
  
  function(request, sender, sendResponse){
      if(request.msg == "refreshFunc") {
        RetrieveAllCharacters();
        }  

  }
);
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse){
      if(request.msg == "refreshMission") RetrieveAllMissions();
  }
);


      function RetrieveAllCharacters(){ //hier halen we alle chars op
        //dit wordt gecalled door de knop in de ui
        //chrome.storage.local.set({"refreshButtonState": false});
        breakLoopChar = true;
        promisesInner2.forEach(element => {
          element.abort();
          promisesInner2 = [];
        });
        chrome.storage.local.remove("characterArray");
        arrayOfCharacterObjects = [];

            return $.ajax({
              url: 'https://naruto-arena.net/characters-and-skills',
              type: "GET",
              dataType: "html",
              success: function(data){
                characterArray = [];
                var allChars = $(data).find("h2");
                $(allChars).each(function(){
                  characterArray.push($(this).text().replace(/\s+/g, '-')); 
                })
                breakLoopChar = false;
                for (let index = 1; index < characterArray.length; index++) {
                  let characterName = characterArray[index];
                

                  if(breakLoopChar == true){
                    break;
                  }

                  var myAjaxInner2 = $.ajax({
                    url: 'https://naruto-arena.net/char/'+characterName,
                    type: "GET",
                    dataType: "html",
                    success: function(data){
                      let characterObject = {};
                      characterObject.name = characterName;
                      characterObject.id = $(data).find('.skilldescr').find('img').attr('src').match(/\d+/)[0];

                      let energyArray = [];
                      $(data).find(".charskill").find('img').each(function(){
                        if($(this).attr('src').includes('energy')){
                          energyArray.push($(this));
                        }
                      })
                      let energyText = '';

                      let greenText = '0';
                      let redText = '0';
                      let blueText = '0';
                      let whiteText = '0';

                      $(energyArray).each(function(){ //dit is het binary gedeelte
                        switch ($(this).attr('src')) {
                          case greenEnergy:
                            greenText = '1';                    
                            break;
                          case redEnergy:
                            redText = '1'; 
                            break;
                          case blueEnergy:
                            blueText = '1'; 
                            break;
                          case whiteEnergy:
                            whiteText = '1'; 
                            break;
                          case randomEnergy:
                            break;
                          default:
                            break;
                        }
                      energyText = greenText+redText+blueText+whiteText;
                      characterObject.energy = energyText;
                      })
                      arrayOfCharacterObjects.push(characterObject);         
                  }
                  })
                  promisesInner2.push(myAjaxInner2);
              }
              $.when.apply($, promisesInner2).done(function(){
                chrome.storage.local.set({"characterArray": arrayOfCharacterObjects});
                //chrome.storage.local.set({"refreshButtonState": true});
                chrome.runtime.sendMessage({msg: "youCanPopulateNow"});
                //chrome.runtime.sendMessage({msg: "enableButton"});
                })
            }

            });
      }
        function RetrieveAllMissions(){
          var arrayOfAllActiveMissions= [];
          chrome.storage.local.remove("missionProgress");

          breakLoopMissionOuter = true;         //------------------------
          breakLoopMissionInner = true;         //these flags and loops make sure that all loops...
            promisesInner.forEach(element => {  //...and ajax calls get aborted and reset...
              element.abort();                  //...so that when we recall this function, we can do it safely.
              promisesInner = [];               //the same happens with the character retrieval function
            });
            promisesOuter.forEach(element => {
              element.abort();
              promisesOuter = [];
            });                                 //------------------------

          $.ajax({
                      
            url: 'https://naruto-arena.net/ninja-missions/',
            type: "GET",
            dataType: "html",
            success: function(data){
              var allLinks = $(data).find(".description");
              var allTrueLinks = [];
              $(allLinks).each(function(){ 
                allTrueLinks.push($(this).find('a').attr('href'));
              })
              breakLoopMissionOuter = false;
              $(allTrueLinks).each(function(index){ //first for each
                if(breakLoopMissionOuter == true){
                  return;
                }   
                var myAjaxOuter = $.ajax({
                      
                  url: allTrueLinks[index],
                  type: "GET",
                  dataType: "html",
                  success: function(data){ 
                      var candidateMission = $(data).find(".bg2");
                      var trueMissionLink = [];
                      $(candidateMission).each(function(index){

                        if(!$(candidateMission[index]).find('.succesfull').text().includes("Mission Completed!") && $(candidateMission[index]).find('.anfo').text().includes("View this mission")){
                          trueMissionLink.push($(this).find('a').attr('href'));
                        }
                      })              
                      $(trueMissionLink).each(function(index){
                        breakLoopMissionInner = false;

                        if(breakLoopMissionInner == true){
                          return;
                        }   
                        var myAjaxInner = $.ajax({
                          url: String(trueMissionLink[index]),
                          type: "GET",
                          dataType: "html",
                          success: function(data){
                        
                              var missionObject = {}; 
                              var missionName = $(data).find('h1').text();
                              var currentMissionLink = trueMissionLink[index];
                              var myString = $(data).find(".pt10").last().clone().children().remove().end().text();
                              var endObjectResults = myString.match(/\(\d+\/\d+\)/g)
                              .map((myString) => myString.slice(1,-1).split('/'))
                              .reduce((obj, [sum, total]) =>{
                                return {
                                  total: obj.total + Number(total),
                                  sum: obj.sum + Number(sum),
                                };
                              }, {total: 0, sum: 0});

                              var percentage = Math.round((endObjectResults.sum / endObjectResults.total * 100));
                              missionObject.name = missionName;
                              missionObject.link = currentMissionLink;
                              missionObject.progress = percentage;
                              arrayOfAllActiveMissions.push(missionObject);
                            
                          }
                      })
                      promisesInner.push(myAjaxInner);
                    
                      });
                  }
              })
          promisesOuter.push(myAjaxOuter);
          })
          $.when.apply($, promisesOuter).done(function(){
            $.when.apply($, promisesInner).done(function(){
              arrayOfAllActiveMissions.sort((a,b) => b.progress - a.progress);
            chrome.storage.local.set({"missionProgress": arrayOfAllActiveMissions});
            //chrome.storage.local.set({"missionButtonState": true});
            //chrome.runtime.sendMessage({msg: "enableButtonMission"});
            chrome.runtime.sendMessage({msg: "youCanPopulateMissionsNow"});
        
            })
          })
          }
          
        })

        }
      })();