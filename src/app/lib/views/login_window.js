(function(App) {
    'use strict';
    var LoginWindow = Backbone.Marionette.ItemView.extend({
        template: '#login-window-tpl',
        className: 'login',

        events: {
            'click #facebookLogin': 'facebookLogin',
            'click #googleLogin': 'googleLogin',
            'click #twitterLogin': 'twitterLogin',
            'click #signupView': 'signupView',
            'click #loginView': 'loginView',
            'click #signupAction': 'signup',
            'click #loginAction': 'login',
        },
        ref: new Firebase('https://popping-torch-2172.firebaseio.com'),


        onShow: function() {
            var that = this;
            $('.email-signup').hide();
            $('.search input').blur();

            Mousetrap.bind('esc', function(e) {
                App.vent.trigger('keyboard:close');
            });


            var authData = this.ref.getAuth();
            if (authData) {
                // this.loginSuccess();
            }

            this.ref.onAuth(function(authData) {
                if (authData) {
                    // save the user's profile into Firebase so we can list users,
                    // use them in Security and Firebase Rules, and show profiles
                    if (authData.provider !== 'twitter' && authData.provider !== 'password') {
                        that.ref.child('users').child(authData.uid).set({
                            provider: authData.provider,
                            name: getName(authData),
                            email: getEmail(authData),
                        });
                    }
                }
            });
            // find a suitable name based on the meta info given by each provider
            function getName(authData) {
                switch (authData.provider) {
                    case 'password':
                        return authData.password.email.replace(/@.*/, '');
                    case 'twitter':
                        return authData.twitter.displayName;
                    case 'facebook':
                        return authData.facebook.displayName;
                    case 'google':
                        return authData.google.displayName;
                }
            }

            function getEmail(authData) {
                switch (authData.provider) {
                    case 'password':
                        return authData.password.email;
                    case 'twitter':
                        return authData.twitter.email;
                    case 'facebook':
                        return authData.facebook.email;
                    case 'google':
                        return authData.google.email;
                }
            }
        },

        onClose: function() {},

        facebookLogin: function() {
            var that = this;
            this.ref.authWithOAuthPopup('facebook', function(error, authData) {
                if (error) {
                    console.log('Login Failed!', error);
                } else {
                    console.log('Authenticated successfully with payload:', authData);
                    that.loginSuccess();
                }
            }, {
                scope: 'email'
            });
        },
        googleLogin: function() {
            var that = this;
            this.ref.authWithOAuthPopup('google', function(error, authData) {
                if (error) {
                    console.log('Login Failed!', error);
                } else {
                    console.log('Authenticated successfully with payload:', authData);
                    that.loginSuccess();
                }
            }, {
                scope: 'email'
            });
        },
        twitterLogin: function() {
            var that = this;
            this.ref.authWithOAuthPopup('twitter', function(error, authData) {
                if (error) {
                    console.log('Login Failed!', error);
                } else {
                    console.log('Authenticated successfully with payload:', authData);
                    that.loginSuccess();
                }
            }, {
                scope: 'email'
            });
        },
        loginSuccess: function() {
            Firebase.goOffline();
            var mainWindow = new App.View.MainWindow();
            App.Window.show(mainWindow);
        },

        signupView: function() {
            $('#formLogin').transition({
                scale: 0,
                complete: function() {
                    $('#formLogin').hide();
                    $('#formSignup').css('display', 'block').transition({
                        scale: 1
                    });
                }
            });
        },
        loginView: function() {
            $('#formSignup').transition({
                scale: 0,
                complete: function() {
                    $('#formSignup').hide();
                    $('#formLogin').css('display', 'block').transition({
                        scale: 1
                    });
                }
            });
        },
        signup: function() {
            var email = $('#emailSignup').val();
            var password = $('#passwordSignup').val();
            var that = this;
            $("#signupAction").toggleClass('spinning');
            this.ref.createUser({
                email: email,
                password: password
            }, function(error, userData) {
                if (error) {
                    $("#signupAction").toggleClass('spinning');
                    switch (error.code) {
                        case 'EMAIL_TAKEN':
                            alert('Email déja enregistré');
                            break;
                        case 'INVALID_EMAIL':
                            alert('Email invalide.');
                            break;
                        default:
                            console.log('Error creating user:', error);
                    }
                    $('#loginAction').toggleClass('spinning');
                } else {
                    console.log('Successfully created user account with uid:', userData.uid);
                    that.ref.child('users').child(userData.uid).set({
                        email: email,
                        password: password,
                    });
                    that.ref.authWithPassword({
                        'email': email,
                        'password': password
                    }, function(error, authData) {
                        if (error) {
                            console.log('Login Failed!', error);
                            $('#loginAction').toggleClass('spinning');
                        } else {
                            that.loginSuccess();
                            console.log('Authenticated successfully with payload:', authData);
                        }
                    });
                }
            });
        },
        login: function() {
            var that = this;
            var email = $('#emailLogin').val();
            var password = $('#passwordLogin').val();
            $('#loginAction').toggleClass('spinning');
            this.ref.authWithPassword({
                'email': email,
                'password': password
            }, function(error, authData) {
                if (error) {
                    $('#loginAction').toggleClass('spinning');
                } else {
                    that.loginSuccess();
                }
            });
        }

    });

    App.View.LoginWindow = LoginWindow;
})(window.App);