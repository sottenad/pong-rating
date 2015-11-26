Parse.initialize("Sy5q1XsECnF2Rb3CxIwD8TcaD89c846oK2lE9R6G", "NqWOFQQErjWfM9JECZdCeIaXsNtFjV2svwDokB3S");


var Pong = window.Pong || {};

window.Pong.User = function(){
    var playerModel = function(data) {
        ko.mapping.fromJS(data, {}, this);
    }
     
    var pongVM = function(){
        var self = this;
        var defaultScore = 1600;
        var Player = Parse.Object.extend('Player');
        var Game = Parse.Object.extend('Game');
      
        self.allPlayers = ko.observableArray([]);
        self.allGames = ko.observableArray([]);
      
        self.newPlayerName = ko.observable();
        self.winningPlayer = ko.observable();
        self.player1 = ko.observable();
        self.player2 = ko.observable();
              
        self.opponent1List = ko.computed(function () {
          return ko.utils.arrayFilter(self.allPlayers(),
            function (player) {
              if (player.name().indexOf(self.player2()) < 0) return true;
            }
          )
        })
        self.opponent2List = ko.computed(function () {
          return ko.utils.arrayFilter(self.allPlayers(),
            function (player) {
              if (player.name().indexOf(self.player1()) < 0) return true;
            }
          )
        })
           
        self.sortFunction = function(a, b) {
          return a.currentRating() < b.currentRating() ? 1 : -1;  
        };

        self.sortedPlayers = ko.computed(function() {
            return this.allPlayers().sort(this.sortFunction);
        }, self);
        
        self.calculateRatings = function(){
            //https://metinmediamath.wordpress.com/2013/11/27/how-to-calculate-the-elo-rating-including-example/
            var k = 32;
            var p1 = ko.utils.arrayFirst(self.allPlayers(), function(item) {return self.player1() === item.name();});
            var p2 = ko.utils.arrayFirst(self.allPlayers(), function(item) {return self.player2() === item.name();});
            var p1Rating = p1.currentRating();
            var p2Rating = p2.currentRating();
            
            var r1 = Math.pow(10, (p1Rating / 400));
            var r2 = Math.pow(10, (p2Rating / 400));
            
            var e1 = r1 / (r1+r2);
            var e2 = r2 / (r1+r2);
            
            var s1,s2;
            if(self.winningPlayer() == self.player1()){
                s1 = 1;
                s2 = 0;
            }else{
                s1 = 0; 
                s2 = 1;
            }
            
            var updatedP1Rating = Math.round(p1Rating + k * (s1 - e1));
            var updatedP2Rating = Math.round(p2Rating + k * (s2 - e2));
            
            console.log(p1.name()+ ' - ' +updatedP1Rating, p2.name()+ ' - '+updatedP2Rating);
            
            // Create a pointer to an object of class Point with id dlkj83d
            self.updateUserRating(p1,updatedP1Rating, self.winningPlayer() == self.player1());
            self.updateUserRating(p2,updatedP2Rating, self.winningPlayer() == self.player2());
            
            return false;
        }
        
        
        self.updateUserRating = function(player, rating, didWin){
            var tpmPlayer = new Player();
            tpmPlayer.id = player.objectId();
            tpmPlayer.set("currentRating", rating );
            tpmPlayer.save(null, {
              success: function(obj) {
                  if(didWin){
                      toastr["success"](player.name() + " Wins! Ranking jumps to "+rating);
                  }
                  var playerObj = ko.utils.arrayFirst(self.allPlayers(), function(item) {return player.name() === item.name();});
                  playerObj.currentRating(rating);
              },
              error: function(point, err) {
                console.log('Error: '+err);
              }
            });
        }
        
        
        self.resetPlayerForm = function(){
            self.newPlayerName('');
            toastr["success"]("Player added");
        }
        
        self.createPlayer = function(){
            var model = this;
            var player = new Player();
            player.set("name", this.newPlayerName());
            player.set("currentRating", 1600);
            player.save(null, {
              success: function(player) {
                self.resetPlayerForm();
                $('#newPlayerModal').modal('hide');
                self.allPlayers.push(player.toJSON());
              },
              error: function(gameScore, error) {
                alert('Failed to create new object, with error code: ' + error.message);
              }
            });
        };
        
        self.fetchAllPlayers = function(){
            var query = new Parse.Query(Player);
            query.descending('currentRating');
            query.find({
              success: function(players) {
                if(players.length > 0){
                   for(var i=0; i<players.length; i++){
                        self.allPlayers.push(new playerModel(players[i].toJSON()));
                   }
                    $('#loadingPlayers').hide();
                }
              },
              error: function(object, error) {
                // The object was not retrieved successfully.
                // error is a Parse.Error with an error code and message.
              }
            });   
        };
        
        self.deletePlayer = function(player){
            var prompt = window.confirm('Are you sure you want to delete '+player.name);
            if(prompt){
                var query = new Parse.Query(Player);
                query.get(player.objectId, {
                  success: function(obj) {
                      obj.destroy({});
                      self.allPlayers.remove(player);
                      toastr["success"]("Player deleted");
                  },
                  error: function(obj, err) {
                    console.log('could not delete:', err);
                    // error is a Parse.Error with an error code and description.
                  }
                });   
            }
        }
        
        /* =============== Games =============== */
        
        self.fetchAllGames = function(){
           var query = new Parse.Query(Game);
           query.include('winner').include('loser');
           query.descending("createdAt");
           query.find({
              success: function(games) {
                if(games.length > 0){
                   for(var i=0; i<games.length; i++){
                      self.allGames.push(games[i].toJSON());
                   }
                }
              },
              error: function(object, error) {
                // The object was not retrieved successfully.
                console.log(error);
              }
            });   
        }
        
        self.updatePlayerSelect = function(){
            
        }

        
        ko.bindingHandlers.formattedTime = {
          update: function(element, valueAccessor) {
            $(element).text(moment(ko.unwrap(valueAccessor())).format('MMM Do'));
          }
        };
        
    }
    
    var init = function(){
        var pongModel = new pongVM();
        ko.applyBindings(pongModel);
        pongModel.fetchAllPlayers();
        pongModel.fetchAllGames();
    }
    
    return {
        init: init   
    }
    
}();

$(function(){
    Pong.User.init();
});


    
