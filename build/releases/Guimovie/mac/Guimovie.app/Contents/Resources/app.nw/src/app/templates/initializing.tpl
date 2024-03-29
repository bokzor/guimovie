<img class="icon-begin" src="/src/app/images/logo-guimovie.png">

<div class="text-begin">
	<div class="init-text"><%= i18n.__("Initializing Guimovie. Please Wait...") %></div>
	<div class="init-progressbar">
		<div id="initbar-contents"></div>
	</div>
	<div id="init-status" class="init-status"></div>

	<p id='waiting-block' style="margin-top:20px;display:none">
			<a href='#' style='color:#fff;font-weight:bold;' class='fixApp'><%= i18n.__("Loading stuck ? Click here !") %></a>
	</p>

	<p id='cancel-block' style="margin-top:20px;display:none">
			<a href='#' style='color:#fff;font-weight:bold;' class='cancel'><%= i18n.__("Cancel") %></a>
	</p>

</div>
