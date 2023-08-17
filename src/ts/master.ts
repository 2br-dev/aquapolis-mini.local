import Lazy from 'vanilla-lazyload';
import Swiper from 'swiper';
import {Pagination, Navigation, Controller} from 'swiper/modules';
import * as M from 'materialize-css';
import Zoomer from './lib/zoomer';
import Mask from 'imask';


Swiper.use([Navigation, Pagination, Controller]);

let lazy = new Lazy({}, document.querySelectorAll('.lazy'));

declare var ymaps:any;
let map = null;

let data = {
	type: 'FeatureCollection',
	features: []
};

let placemarks = 0;
(window as any).placemarks = placemarks;
(window as any).map = map;
let manager:any;
(window as any).manager = manager;


interface Feature{
	type:string,
	id: number,
	geometry: {
		type: 'string',
		coordinates: Array<number>
	}
}

(() => {

	var current_date = new Date();
	var tommorow = current_date.setDate(current_date.getDate() + 1);

	document.querySelectorAll('input.phone').forEach((el:HTMLInputElement) => {
		Mask(el, {
			mask: '{+7} (000) 000 00-00'
		})
	})

	// Picker
	let datePickers = M.Datepicker.init(document.querySelectorAll('.datepicker'), {
		format: "dd mmmm yyyy",
		minDate: new Date(tommorow),
		onSelect: loadIntervals,
		i18n: {
			done: "Ок",
			clear: "Очистить",
			cancel: "Отмена",
			months: ["Янаварь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
			monthsShort: ["Янв", "Февр", "Мрт", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
			weekdays: ["Понедельник","Вторник","Среда","Четверг","Пятница","Суббота","Воскресенье"],
			weekdaysShort: ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"],
			weekdaysAbbrev: ["П","В","С","Ч","П","С","В"]
		}
	});

	// Модалки
	let modal = M.Modal.init(document.querySelectorAll('.modal'));

	// Простановка текущего года
	let year = new Date().getFullYear().toString();
	$('#year-value').text(year);

	// Слайдер акций
	if(document.querySelectorAll('.swiper#actions').length){

		// Основной слайдер
		let actionsSlider = new Swiper('#actions', {
			slidesPerView: 'auto',
			spaceBetween: 20,
			loop: true,
			loopedSlides: 5,
			pagination: {
				el: ".actions-amount",
				type: "custom",
				renderCustom: (swiper:Swiper, current:number, total:number) => {
					let currentLead = ('0' + current).slice(-2);
					let totalLead = ('0' + total).slice(-2);
					return `<span class="current">${currentLead}</span><span class="total">/${totalLead}</span>`;
				}
			},
			navigation: {
				nextEl: '.actions-next',
				prevEl: '.actions-prev'
			},
			on: {
				init: (swiper) => {
					updateActionsProgress(swiper);
				},
				slideChange: (swiper) => {
					updateActionsProgress(swiper);
				}
			}
		})
	}

	// Слайдер воды с тремя ценами
	if(document.querySelectorAll('.swiper#delivery').length){
		let deliverySlider = new Swiper('#delivery', {
			spaceBetween: 10,
			loop: true,
			navigation: {
				nextEl: '.delivery-next',
				prevEl: '.delivery-prev'
			},
			breakpoints: {
				300: {
					slidesPerView: 2,
					spaceBetween: 0
				},
				700: {
					slidesPerView: 3,
					spaceBetween: 0
				},
				800: {
					slidesPerView: 3,
					spaceBetween: 10
				},
				1200: {
					slidesPerView: 4,
					spaceBetween: 10
				},
				1600: {
					slidesPerView: 5,
					spaceBetween: 10
				},
				1900: {
					slidesPerView: 6,
					spaceBetween: 10
				}
			},
			pagination: {
				el: '#delivery-pagination',
				type: 'bullets',
				dynamicBullets: true,
				dynamicMainBullets: 5
			},
			on: {
				init: (swiper:Swiper) => {
					updateSliderAmount(swiper);
				},
				slideChange: (swiper:Swiper) => {
					updateSliderAmount(swiper);
				}
			}
		})
	}

	// Слайдер воды с одной ценой
	if(document.querySelectorAll('.swiper#pickup').length){
		let pickupSlider = new Swiper('#pickup', {
			spaceBetween: 10,
			loop: true,
			navigation: {
				nextEl: '.pickup-next',
				prevEl: '.pickup-prev'
			},
			pagination: {
				type: 'bullets',
				el: '#pickup-pagination',
				dynamicBullets: true,
				dynamicMainBullets: 5
			},
			breakpoints: {
				300: {
					slidesPerView: 2,
					spaceBetween: 0
				},
				700: {
					slidesPerView: 2,
					spaceBetween: 0
				},
				800: {
					slidesPerView: 3,
					spaceBetween: 10
				},
				1200: {
					slidesPerView: 2,
					spaceBetween: 10
				},
				1850: {
					slidesPerView: 3
				}
			}
		})
	}

	// Слайдер городов
	let citySlider = new Swiper('.swiper#cities', {
		navigation: {
			nextEl: '.city-next',
			prevEl: '.city-prev'
		},
		on: {
			'slideChange': (swiper:Swiper) => {

				let activeSlide = swiper.realIndex;
				let slide = swiper.slides[activeSlide];

				let lon = parseFloat(slide.dataset['lon']);
				let lat = parseFloat(slide.dataset['lat']);
				let zoom = parseInt(slide.dataset['zoom']);
				let center = [lon, lat];

				let activePlacemark = manager.objects.getById(activeSlide);
				let activeCoordinates = activePlacemark.geometry.coordinates;
				
				map.setCenter(activeCoordinates, zoom, {
					checkZoomRange: true,
					duration: 400,
					timingFunction: 'ease-in-out'
				});

				let coords = [];
				

				for(let i=0; i<placemarks; i++){

					let placemark = manager.objects.getById(i);
					let isCurrent = i == activeSlide;
					
					if(i == activeSlide){
						coords = placemark.geometry.coordinates;
					}

					let color = isCurrent ? 'red' : '#1e98ff';

					manager.objects.setObjectOptions(i, {
						iconColor: color
					})
				}

				debugger;

				map.setCenter(coords, zoom, {
					checkZoomRange: true,
					duration: 400,
					tinmingFunction: 'ease-in-out'
				})
			}
		}
	})

	// Слайдер внутри карточки товара
	document.querySelectorAll('.card-water').forEach((el:HTMLElement, i:number) => {
		let sliderEl = <HTMLElement>el.querySelector('.swiper');
		let pagination = <HTMLElement>el.querySelector('.product-pagination');
		let slidesCount = sliderEl.querySelectorAll('.swiper-slide').length;

		if(slidesCount > 1)
		{
			let productSlider = new Swiper(sliderEl, {
				loop: true,
				nested: true,
				pagination: {
					el: pagination,
					type: 'bullets'
				}
			})
		}
	});

	// Слайдер с помпами
	if(document.querySelectorAll('.swiper#pump').length){
		let pumpSwiper = new Swiper('#pump', {
			slidesPerView: 2,
			breakpoints: {
				700: {
					spaceBetween: 0
				},
				800: {
					spaceBetween: 10
				}
			}
		})
	}

	// Инициализация карты при её наличии на странице
	if(document.querySelectorAll('#map').length)
	{

		loadScript('https://api-maps.yandex.ru/2.1/?apikey=c74c9eb1-d45a-473c-8975-488ec41de8cc&lang=ru_RU')

			.then(() => {
				ymaps.ready(function(){

					// Собираем данные городов
					let citiesSwiper:Swiper = (document.querySelector('#cities') as any).swiper;
					let citiesSlides:Array<HTMLElement> = Array.from(citiesSwiper.slides);

					let citySlides = document.querySelectorAll('data-lon');

					let points = [];
					let lons = new Array<number>();
					let lats = new Array<number>();
					
					citiesSlides.forEach((el:HTMLElement, i:number) => {
						let pointsStr = el.dataset['point'];
						let pointsArray = pointsStr?.split(',');
						let lon = parseFloat(pointsArray[0]);
						let lat = parseFloat(pointsArray[1]);
						lons.push(lon);
						lats.push(lat);
						points.push([lon, lat]);
					});

					let activeIndex = citiesSwiper.activeIndex;

					let firstCenter = [parseFloat(citiesSlides[activeIndex].dataset['lon']), parseFloat(citiesSlides[0].dataset['lat'])];
					let firstZoom = parseFloat(citiesSlides[activeIndex].dataset['zoom'])

					map = new ymaps.Map('map', {
						center: firstCenter,
						zoom: firstZoom
					})

					manager = new ymaps.ObjectManager({
						clusterize: false,
						gridSize: 32
					});

					(window as any).manager = manager;

					let data = {
						type: 'FeatureCollection',
						features: []
					}
					
					map.behaviors.disable('scrollZoom');

					points.forEach((point:Array<number>, i:number) => {
						data.features.push({
							type: 'Feature',
							id: i,
							geometry: {
								type: 'Point',
								coordinates: point
							}
						});

						placemarks++;
					})

					manager.add(data);

					map.geoObjects.add(manager);

					manager.objects.setObjectOptions(0, {
						iconColor: 'red'
					})

				});
				
			})
			.catch(err => {
				console.log(err);
			})
	}

	// Инициализация вкладок
	if($('.product-tabs').length){
		initProductTabs();
	}

	// Обновление индикатора вкладок при изменении размеров окна браузера
	window.onresize = function(){
		$('.product-tabs').each((index, el) => {
			let inx = $(el).find('.product-tab').index($('.product-tab.active'));
			if(inx < 0) inx++;
			initProductTabIndicator($(el), inx);
		});
	}

	// Нажатие умной кнопки
	$('body').on('click', '.smart-bttn .bttn', (e:JQuery.ClickEvent) => {
		e.preventDefault();
		let $el = $(e.currentTarget);
		let $parent = $el.parents('.smart-bttn');
		let $input = $parent.find('input');
		let val = parseInt($input.val() as any);
		val++;
		$input.val(val);
		$parent.addClass('flip');
	});

	// Увеличение количества
	$('body').on('click', '.smart-bttn #plus', (e:JQuery.ClickEvent) => {
		e.preventDefault();
		let $el = $(e.currentTarget);
		let $parent = $el.parents('.smart-bttn');
		let $input = $parent.find('input');
		let val = parseInt($input.val() as any);
		val++;
		$input.val(val);
	});

	// Уменьшение количества
	$('body').on('click', '.smart-bttn #minus', (e:JQuery.ClickEvent) => {
		e.preventDefault();
		let $el = $(e.currentTarget);
		let $parent = $el.parents('.smart-bttn');
		let $input = $parent.find('input');
		let val = parseInt($input.val() as any);
		val--;

		if(val == 0){
			$parent.removeClass('flip');
		}
		
		$input.val(val);
	});

	// Zoomer
	let zoomer = new Zoomer('.zoomer', 'src', true, 300);

	// Раскрытие городов в секции наши магазины
	$('body').on('click', '.city-trigger', (e:JQuery.ClickEvent) => {
		e.preventDefault();
		let el = <HTMLLinkElement>e.currentTarget;
		let $parent = $(el).parents('.cities');
		let $descriptions = $parent.find('.city-description').slideUp('fast', null, () => {
			$parent.find('.city-description').addClass('hidden');
		});
		$(el).next().slideDown('fast', () => {
			$(el).next().removeClass('hidden');
		});
	
	})

	// Инициализация карты блока наши магазины
	if(document.querySelectorAll('#ymap').length){

		let firstEl = $('.map-navi:first-of-type').get(0);
		$(firstEl).addClass('active');

		$('[data-city] .city-description').hide();
		$("[data-city='0'] .city-description").show();

		loadScript('https://api-maps.yandex.ru/2.1/?apikey=c74c9eb1-d45a-473c-8975-488ec41de8cc&lang=ru_RU')

		.then(() => {
			
			ymaps.ready(function(){
				let coordsElements = document.querySelectorAll('[data-point]');
				let points = [];
				let lons = new Array<number>();
				let lats = new Array<number>();
				let zooms = new Array<number>();

				coordsElements.forEach((el:HTMLElement, i:number) => {
					let pointZoom = parseInt(el.dataset['zoom']);
					let pointsStr = el.dataset['point'];
					let pointsArray = pointsStr?.split(",");
					let lon = parseFloat(pointsArray[0]);
					let lat = parseFloat(pointsArray[1]);
					zooms.push(pointZoom);
					lons.push(lon);
					lats.push(lat);
					points.push([lon, lat]);					
				})

				let firstCityCoordsEl = <HTMLElement>document.querySelectorAll('.map-navi')[0];
				let center = [firstCityCoordsEl.dataset['lon'], firstCityCoordsEl.dataset['lat']]
				let zoom = firstCityCoordsEl.dataset['zoom'];

				map = new ymaps.Map('ymap', {
					center: center,
					zoom: zoom
				});

				map.behaviors.disable('scrollZoom');

				manager = new ymaps.ObjectManager({
					clusterize: false,
					gridSize: 32
				});

				points.forEach((point:Array<number>, i:number) => {
					data.features.push({
						type: 'Feature',
						id: i,
						geometry: {
							type: 'Point',
							coordinates: point
						}
					})
				})

				manager.add(data);
				map.geoObjects.add(manager);

				// Подсветка активного города при старте
				manager.objects.setObjectOptions(0, {
					iconColor: 'red'
				})


			});
		})
		.catch(err => {
			console.log(err);
		})
	}

	// Переключение города в блоке с картой магазинов
	$('body').on('click', '.map-navi', (e:JQuery.ClickEvent) => {
		e.preventDefault();
	
		let city = e.currentTarget.dataset['city'];
		let lon = e.currentTarget.dataset['lon'];
		let lat = e.currentTarget.dataset['lat'];
		let zoom = e.currentTarget.dataset['zoom'];
		let index = e.currentTarget.dataset['index'];

		map.setCenter([lon, lat], zoom, {
			checkZoomRange: true,
			duration: 400,
			timingFunction: 'ease-in-out'
		});

		let pointIndex = nearestPlacemarkId(index);
		for(let i=0; i<data.features.length; i++)
		{
			let color = i == pointIndex ? 'red' : '#1e98ff'
			manager.objects.setObjectOptions(i, {
				iconColor: color
			})
		}
	
		$('.map-navi').removeClass('active');
		$(e.target).addClass('active');
	
		$('[data-city] .city-description').hide();
		$("[data-city=" + index + "] .city-description").show();
	
	});

	// Инициализация слайдера городов в блоке с картой магазинов
	document.querySelectorAll('.city').forEach((el:HTMLElement, i:number) => {
		let fasadSwiperEl = <HTMLElement>el.querySelector('.fasad-swiper');
		let infoSwiperEl = <HTMLElement>el.querySelector('.fasad-info-swiper');
		
		if(!fasadSwiperEl || !infoSwiperEl) return;
		
		let paginationEl = <HTMLElement>el.querySelector('.contacts-swiper-pagination');
		let slidesCount = fasadSwiperEl.querySelectorAll('.swiper-slide').length;


		if(slidesCount > 1){

			let fasadSwiper = new Swiper(fasadSwiperEl, {
				pagination: {
					el: paginationEl,
					type: 'bullets'
				},
				on: {
					slideChange: (swiper) => {
						let points = data.features;
						let slide = swiper.slides[swiper.activeIndex];
						let coords = slide.dataset['coord']?.split(",");
						
						let point:Feature = data.features.filter((el:Feature) => {
							return el.geometry.coordinates[0] == parseFloat(coords[0]) && el.geometry.coordinates[1] == parseFloat(coords[1])
						})[0];

						let index = point.id;
						let center = [];


						for(let i=0; i<data.features.length; i++)
						{
							let current = i == index;
							let color = current ? 'red' : '#1e98ff'

							manager.objects.setObjectOptions(i, {
								iconColor: color
							})
						}
					}
				}
			});
			let infoSwiper = new Swiper(infoSwiperEl);
	
			fasadSwiper.controller.control = infoSwiper;
			infoSwiper.controller.control = fasadSwiper;
		}
	});

	// Инициализация слайдера продукции
	if(document.querySelectorAll('#products-swiper').length)
	{
		let swiper = new Swiper('#products-swiper', {
			pagination: {
				el: '#product-pagination',
				type: 'bullets',
				dynamicBullets: true,
				dynamicMainBullets: 5
			},
			navigation: {
				nextEl: '.product-next',
				prevEl: '.product-prev'
			},
			breakpoints: {
				300: {
					slidesPerView: 2,
					spaceBetween: 0
				},
				700: {
					slidesPerView: 3,
					spaceBetween: 10
				},
				1300: {
					slidesPerView: 4,
					spaceBetween: 10
				},
				1700: {
					slidesPerView: 5,
					spaceBetween: 10
				}
			}
		})
	}

	// Выбор адреса
	$('body').on('change', '[name="address"]', (e:JQuery.ChangeEvent) => {
		if($(e.target).val() == "user-address"){
			$('#user-address').removeClass('hidden');
		}else{
			$('#user-address').addClass('hidden');
		}
	});
	
	// Установка временного периода
	$('body').on('change', '[name="period"]', (e:JQuery.ChangeEvent) => {
		
		let el = <HTMLInputElement>e.currentTarget;
		let val = el.value;

		switch(val){
			case "manual":
				$('#date').removeClass('hidden');
				break;
			case "auto":
				$('#interval').addClass('hidden');
				$('#date').addClass('hidden');
				break;
		}
	})

	// Переключение типа аккаунта
	$('body').on('change', '[name="account-type"]', (e:JQuery.ChangeEvent) => {
		let newVal = $(e.currentTarget).val();
		$('#fieldset').attr('data-mode', newVal.toString());
	});

	// Открытие popup-меню
	$('body').on('click', '.popup-trigger', (e:JQuery.ClickEvent) => {
		let el = e.currentTarget;
		var already = $(el).parent().find('.popup').hasClass('open');
		var newClass = already ? '' : 'open';
		$('.popup-wrapper .popup').removeClass('open');
		$(el).parent().find('.popup').addClass(newClass);
	});

	// Закрытие выпадающих элементов по клику мимо
	$('body').on('click', (e:JQuery.ClickEvent) => {
	
		if(e.originalEvent){
			
			var path:Array<EventTarget> = e.originalEvent.composedPath();
			var dropdownIndex = path.filter(el => {
				return $(el).hasClass('popup');
			});
			
			var popups = path.filter(el => {
				return $(el).hasClass('popup-wrapper');
			});
		
			if(!dropdownIndex.length){
				$('.dropdown-wrapper .popup').removeClass('open');
			}
		
			if(!popups.length){
				$('.popup-wrapper .popup').removeClass('open');
			}
		}
	});

	// Изменение пароля
	$('body').on('change', '#change-password-trigger', (e:JQuery.ChangeEvent) => {
		$('#change-password').toggleClass('visible');
	});

	// Отображение деталей заказа
	$('body').on('click', '.order', (e:JQuery.ClickEvent) => {

		let _this = e.currentTarget;
	
		var already = $(_this).hasClass('expanded');
		var newClass = already ? '' : 'expanded'
		var path = e.originalEvent.composedPath();
	
		var link_in_path = path.filter(el => {
			return ((<HTMLElement>el).tagName == 'A' && !$(el).hasClass('expander-trigger'))
		});
	
		if(!link_in_path.length){
			$('tr.order').removeClass('expanded');    
			$(_this).addClass(newClass);
		}
	});

	// Клик по иконке купить в карточке товара
	$('body').on('click', '.buy', (e:JQuery.ClickEvent) => {
		e.preventDefault();
		let el = e.currentTarget;
		let $parent = $(el).parents('.action');
		let input = $parent.find('input')[0];

		input.value = (parseInt(input.value) + 1).toString();
		$parent.addClass('flip');

	});

	// Уменьшение количества в карточке
	$('body').on('click', '.card-button.minus', function (e) {
		e.preventDefault();
		var el = e.currentTarget;
		var $parent = $(el).parents('.action');
		var input = $parent.find('input')[0];
		input.value = (parseInt(input.value) - 1).toString();
		if (input.value === "0") $parent.removeClass('flip');
	});

	// Увеличение количества в карточке
	$('body').on('click', '.card-button.plus', function (e) {
		e.preventDefault();
		var el = e.currentTarget;
		var $parent = $(el).parents('.action');
		var input = $parent.find('input')[0];
		if (parseInt(input.value) <= 98) {
		  input.value = (parseInt(input.value) + 1).toString();
		}
	});

})();

function loadIntervals(date:Date){
    var dom = `<div><input type="radio" name="delivery-interval" class="styled" id="interval-[+id+]" value="[+interval+]"><label for="interval-[+id+]">[+label+]</label></div>`;
    var dom_ready = "";
    $('input[name="delivery_date_timestamp"]').val(date.getTime()/1000);
    $.ajax({
        url: $('#delivery-date').data('url'),
        type: "POST",
        dataType: "JSON",
        data: {
            delivery_date: date.getTime()/1000
        },
        success: (res) => {
            $('input[name="delivery_date"]').val(res.formatted_date);
            for(var key in res.intervals){
                var t = dom;
                t = (t as any).replaceAll('[+id+]', (+key+1)).replace('[+interval+]', res.intervals[key]).replace('[+label+]', res.intervals[key]);
                dom_ready += t;
            }
            $('#interval-wrapper').html(dom_ready);
            $('#delivery-interval').removeClass('hidden');
            $('#interval-0').prop('checked', 'checked');
        },
        error: (err) => {
			$('#interval').removeClass('hidden');
            console.error(err)
        }
    });
}

function nearestPlacemarkId(cityId:number){
	let host = <HTMLElement>$(`[data-city="${cityId}"] .fasad-info-swiper .swiper-slide-active .addressName`)[0];
	if(!host){
		host = <HTMLElement>$(`[data-city="${cityId}"] .fasad-info-swiper .swiper-slide:first-of-type .addressName`)[0];
	}
	let coords = host.dataset['point']?.split(",");

	let point:Feature = data.features.filter((el:Feature) => {
		return el.geometry.coordinates[0] == parseFloat(coords[0]) && el.geometry.coordinates[1] == parseFloat(coords[1]);
	})[0]

	return point.id;
}

// Простановка количества слайдов на слайдерах (1/n)
function updateSliderAmount(swiper:Swiper)
{
	let slidesCount = ("0" + swiper.slides.length).slice(-2);
	let currentNum = ("0" + (swiper.realIndex + 1)).slice(-2);
	let output = `${currentNum} / ${slidesCount}`;
	$(swiper.el).parent().find('.amount').html(output);

}

// Прогресс-бар слайдера акций
function updateActionsProgress(swiper:Swiper)
{
	let slidesCount = swiper.slides.length;
	let current = swiper.realIndex + 1;
	let percent = (current / slidesCount) * 100;
	
	let value = <HTMLElement>document.querySelector('.amount-progress-value');
	value.style.width = percent + "%";
}

// Загрузка внешних скриптов
function loadScript(FILE_URL:string, async = true, type = "text/javascript"){
    return new Promise((resolve, reject) => {
        try {
            const scriptEle = document.createElement("script");
            scriptEle.type = type;
            scriptEle.async = async;
			scriptEle.crossOrigin = 'anoonymus'
            scriptEle.src =FILE_URL;

            scriptEle.addEventListener("load", (ev) => {
				resolve({ status: true });
            });

            scriptEle.addEventListener("error", (ev) => {
                reject({
                    status: false,
                    message: `Failed to load the script ${FILE_URL}`,
					errorData: JSON.stringify(ev)
                });
            });

            document.body.appendChild(scriptEle);
        } catch (error) {
            reject(error);
        }
    });
};

// Инициализация вкладок
function initProductTabs(){
	let $el = $('.product-tabs');
	let inx = $el.find('.product-tab').index($('.product-tab.active'));
	if(inx < 0) inx++;
	initProductTabIndicator($el, inx);
	
	let $tabContent = $el.next();
	let $contents = $tabContent.find('.tab-content');

	let activeContent = $contents.get(inx);
	$contents.slideUp('fast');
	$(activeContent).slideDown('fast');

	$el.find('.product-tab').on('click', (e:JQuery.ClickEvent) => {
		e.preventDefault();
		let $me = $(e.currentTarget);
		let $parent = $me.parents('.product-tabs');
		$parent.find('.product-tab').removeClass('active');
		$me.addClass('active');
		let inx = $parent.find('.product-tab').index($('.product-tab.active'));
		initProductTabIndicator($parent, inx);

		let $tabContent = $parent.next();
		let $contents = $tabContent.find('.tab-content');
		let activeContent = $contents.get(inx);

		$contents.slideUp('fast');
		$(activeContent).slideDown('fast');
		
	})
}

// Инициализация индикатора вкладок
function initProductTabIndicator($tabsElement:JQuery<HTMLElement>, index:number){
	let width = $tabsElement[0].clientWidth;
	let tab = $('.product-tab').get(index);
	let itemWidth = tab.getBoundingClientRect().width;

	let tab_left = Math.round($(tab).position().left);
	let tab_right = Math.round(width - (itemWidth + tab_left));

	$tabsElement.find('.indicator').css({
		left: tab_left+'px',
		right: tab_right+'px',
		transition: 'left .2s, right .2s',
	});
}