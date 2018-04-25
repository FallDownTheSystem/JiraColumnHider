// ==UserScript==
// @name Jira Column Toggle
// @author FallDownTheSystem
// @namespace FDTS
// @version 0.6
// @match *://*.atlassian.net/secure/RapidBoard.jspa*
// @require https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @run-at document-idle
// @grant GM_getValue
// @grant GM_setValue
// ==/UserScript==

(function() {
	var columnsFound = 0;
	function remove(array, element) {
		const index = array.indexOf(element);

		if (index !== -1) {
			array.splice(index, 1);
		}
	}

	var getUrlParameter = function getUrlParameter(sParam) {
		var sPageURL = decodeURIComponent(window.location.search.substring(1)),
			sURLVariables = sPageURL.split('&'),
			sParameterName,
			i;

		for (i = 0; i < sURLVariables.length; i++) {
			sParameterName = sURLVariables[i].split('=');

			if (sParameterName[0] === sParam) {
				return sParameterName[1] === undefined
					? true
					: sParameterName[1];
			}
		}
	};

	var param = getUrlParameter('rapidView');

	function addGlobalStyle(css) {
		var head, style;
		head = document.getElementsByTagName('head')[0];
		if (!head) {
			return;
		}
		style = document.createElement('style');
		style.type = 'text/css';
		style.innerHTML = css;
		head.appendChild(style);
	}

	addGlobalStyle(`
		.eye-toggle-icon { opacity: 0.5; margin: -2px 0px -4px 0px; align-self: flex-end; transition: 0.3s; }
		.eye-toggle-icon:hover { opacity: 1.0; }
		.showButton { opacity: 0.5; margin: 0px -6px -7px 0px; }
	`);

	function hideColumn(index) {
		$('.ghx-column:not(.ui-sortable):eq(' + index + ')').hide();

		$('.ghx-columns').each(function(i, obj) {
			$(obj)
				.children()
				.eq(index)
				.hide();
		});
	}

	var appendButton = function(index) {
		var buttonText = $('.eye-toggle:eq(' + index + ')')
			.parent()
			.find('.ghx-column-header-flex-1 h2')
			.text()
			.toUpperCase();
      
        $(`#ghx-quick-filters > ul > li[data-index='${index}']`).remove();

		$('#ghx-quick-filters > ul').append(
			`<li class="ShowColumnButtonListItem" data-index="${index}">
				<button class="aui-button aui-button-subtle" style="padding: 0px 10px !important;">
					${buttonText}
					<img class="showButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAQAAABKfvVzAAAA/ElEQVR4Ad3MT8pSYRiG8d8gj6INwpYQUUsQ/DcoooVIzQMhav7x0TcRFAmKoKBZiLSDBoYgtBU9DjOwM3p4BgcX4HWN7vt+3tdVUuh77X3lK30NF3nqs9I5WfrkiVqa7vzLx+HJB4UMHtrGwQ8DrcqhVXQbXYn7/sT0RmYa/U5H8D39TsvSUWmhiXVsXwFeOocDLCPNMUrrc2CbqhaOkQ5op/V3/YMy0r7+wYtUDbGINMM4rc8AvkW1QtPcwd5MgZ+xfRF07KKeyryNfqst0bWJaW2kXTlOv//yQAaFW6c4yP51o6GWxz465GN7S49c5J6eiXeVE70qXSH/Ab1yu/g+RVcWAAAAAElFTkSuQmCC" >
				</button>
			</li>`
		);

		$('.ShowColumnButtonListItem[data-index="' + index + '"]').click(
			function() {
				var idx = $(this).data('index');

				var colArray = GM_getValue(`columns_${param}`, []);
				remove(colArray, idx);
				GM_setValue(`columns_${param}`, colArray);

				$('.ghx-columns').each(function(i, obj) {
					$(obj)
						.children()
						.eq(idx)
						.show();
				});

				$(`.ghx-column:eq(${idx})`).show();
				$(this).remove();
			}
		);
	};

	var targetNode = document.getElementById('jira');

	// Options for the observer (which mutations to observe)
	var config = { attributes: false, childList: true, subtree: true };

	// Callback function to execute when mutations are observed
	var callback = function(mutationsList) {
		for (var mutation of mutationsList) {
			if (mutation.type == 'childList') {
				for (node of mutation.addedNodes) {
					// Look for overlays being added
					if ($(node).find('.ghx-zone-overlay-table').length > 0) {
						// Hide all the overlays for hidden columns
						var colArray = GM_getValue(`columns_${param}`, []);
						var arrayLength = colArray.length;
						for (var i = 0; i < arrayLength; i++) {
							var col = colArray[i];
							$('.ghx-zone-overlay-table')
								.children()
								.eq(col)
								.hide();
						}
					}
					// Look for columns being added
					if ($(node).find('div.ghx-column-header-flex').length > 0) {
						columnsFound++;
						if (columnsFound < 1) {
							return;
						}
                      
                        $('.eye-toggle').remove();

						// Fix css for column headers, add eye icons for hiding columns
						$('div.ghx-column-header-flex')
							.css('justify-content', 'space-between')
							.append(function(n) {
								return `<i class="eye-toggle" data-index="${n}">
											<img class='eye-toggle-icon' src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAQAAABKfvVzAAABJklEQVR4Ac3QvYoTYRhH8R842dmZRRTxFvYaXMQEFUwheBdBvIE0BhsbrY2FAT/ARiw2rKbTSRMQA4Klt2HslBSvIC8PDBkklXj+3RkOz8z4X7nlncr+eC/5kJMD19zzwMRdV/V0UllG8koSszFzrINak5PCqdTa1qPdS5etJclHlZ4TpUN984hWLgo476skRSIYh18Lz5vQP3NSeG6qxFk8eyFzW4oNNZG89QQDKXYD+CKUUmUraf4kM9RSbAWshXKIH1JOzuFoNxgKpY+nUiTtV7ou8zrUHKWpjV856cXPfSk4Et9hDKg0reSzCsElnyI5M1Cr3RFXPHSBNgce20odW6ro5tgzG0nMd9/+nlA4MXLfxMgVhdoykv3IyQL2TxZu+kf8Bok7vE3m45FzAAAAAElFTkSuQmCC">
										</i>`;
							});

						// Hide column on eye click
						$('.eye-toggle').click(function(event) {
							event.preventDefault();
							var idx = $(this).data('index');

							var colArray = GM_getValue(`columns_${param}`, []);

							colArray.push(idx);
							GM_setValue(`columns_${param}`, colArray);

							hideColumn(idx);

							appendButton.call(this, idx);

							//observer.disconnect();
						});

						// Hide columns and append buttons
						var colArray = GM_getValue(`columns_${param}`, []);

						var arrayLength = colArray.length;
						for (var i = 0; i < arrayLength; i++) {
							var col = colArray[i];
							hideColumn(col);
							appendButton.call(this, col);
						}
					}
				}
			}
		}
	};

	// Create an observer instance linked to the callback function
	var observer = new MutationObserver(callback);

	// Start observing the target node for configured mutations
	observer.observe(targetNode, config);
})();
