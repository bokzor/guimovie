<div id="login">
		<img class="icon-begin login-logo" src="/src/app/images/logo-guimovie.png">

	<div id="formLogin">
		<form   action="javascript:void(0);" method="get">
			<fieldset class="clearfix">
				<p><span class="fa fa-envelope"></span><input type="text" id="emailLogin"  placeholder="<%= i18n.__('Email') %>" required></p> <!-- JS because of IE support; better: placeholder="Username" -->
				<p><span class="fa fa-lock"></span><input type="password"  id="passwordLogin" placeholder="<%= i18n.__('Password') %>"  required></p> <!-- JS because of IE support; better: placeholder="Password" -->
				<p><input class="spinner-submit inset" type="submit" id="loginAction" value="<%= i18n.__('Connect') %>"></p>
			</fieldset>
		</form>
		<p><%= i18n.__('Not a member') %> ? <a id="signupView"><%= i18n.__('Sign up now') %></a><span class="fontawesome-arrow-right"></span></p>
	</div>
	
	<div style="display:none; -webkit-transform: scale(0)"  id="formSignup">
		<form action="javascript:void(0);" method="get">
			<fieldset class="clearfix">
				<p><span class="fa fa-envelope"></span><input type="text" id="emailSignup" placeholder="<%= i18n.__('Email') %>"  required></p> 

				<p><span class="fa fa-lock"></span><input type="password" id="passwordSignup" placeholder="<%= i18n.__('Password') %>"  required></p> 

				<p><input class="spinner-submit inset" type="submit" id="signupAction" value="<%= i18n.__('Sign up') %>"></p>
			</fieldset>
		</form>
		<p><%= i18n.__('Already a member') %> ? <a id="loginView"><%= i18n.__('Login now') %></a><span class="fontawesome-arrow-right"></span></p>
	</div>
	<div class="footer-login">
		<ul class="social-links">
			<li id="twitterLogin" class="twitter"><a href="#"><span>twitter</span></a></li>
			<li id="googleLogin" class="google-plus"><a href="#"><span>google</span></a></li>
			<li id="facebookLogin" class="facebook"><a href="#"><span>facebook</span></a></li>
		</ul>
	</div>

</div> 

