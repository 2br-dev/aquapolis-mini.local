class Zoomer{

	slides = [];
	slideElements = [];
	isDragging:boolean;
	startX:number;
	startY:number;
	selectedIndex:number;
	isAnimating:boolean;
	transitionMs:number;
	transitionS: number;

	isDataset: boolean;
	srcAttribute:string;
	selector:string;

	nextIconSelector:string;
	prevIconSelector:string;
	closeIconSelector:string;

	constructor(
		selector:string, 
		srcAttribute:string, 
		isDataSet:boolean, 
		transition:number = 400,
		prevIconSelector:string = 'mdi mdi-chevron-left',
		nextIconSelector:string = 'mdi mdi-chevron-right',
		closeIconSelector:string = 'mdi mdi-close'
	){

		this.transitionMs = transition;
		this.transitionS = transition / 1000;
		this.isDataset = isDataSet;
		this.srcAttribute = srcAttribute;
		this.selector = selector;

		this.prevIconSelector = prevIconSelector;
		this.nextIconSelector = nextIconSelector;
		this.closeIconSelector = closeIconSelector;

		document.querySelectorAll(selector).forEach((element:HTMLImageElement) => {
			element.addEventListener('click', this.open.bind(this));
		})
	}

	open(e:MouseEvent)
	{

		// Формирование массива элементов
		let galleryId = (<HTMLImageElement>e.currentTarget).dataset['gallery'];
		let queryString = galleryId ? `[data-gallery="${galleryId}"]` : this.selector;

		this.slides = [];
		this.slideElements = [];

		document.querySelectorAll(queryString).forEach((element:HTMLElement, i:number) => {

			if(!this.isDataset && this.srcAttribute != 'src'){
				this.slides.push((<HTMLImageElement>element).src);
			}else{
				this.slides.push(element.dataset[this.srcAttribute]);
			}
			this.slideElements.push(element);
		})

		// Формирование индексов
		let el = <HTMLImageElement>e.currentTarget;
		let image = el.src;

		if(!image){
			image = el.style.backgroundImage.replace("url(\"", '').replace('\")', '');
		}

		image = image.replace(location.origin, '');
		let index = this.slideElements.indexOf(el);

		let prev = index - 1;
		let next = index + 1;
		if(prev < 0){ prev = this.slides.length - 1 }
		if(next >= this.slides.length){ next = 0 }

		this.selectedIndex = index;

		let prevImg = this.slides[prev];
		let nextImg = this.slides[next];

		// Формирование изображений
		let currentImgEl = <HTMLImageElement>document.createElement('img');
		let nextImgEl = <HTMLImageElement>document.createElement('img');
		let prevImgEl = <HTMLImageElement>document.createElement('img');
		currentImgEl.src = image;
		nextImgEl.src = nextImg;
		prevImgEl.src = prevImg;

		// Формирование DOM::::::::::::::::::::::::::::::::::::::::::::::::::::
		// Формируем оболочку

		this.isAnimating = true;
		let slideboxWrapper = document.createElement('div');
		slideboxWrapper.className = 'zoomer-wrapper';
		let slidebox = document.createElement('div');
		slidebox.classList.add('zoomer-viewer');

		let closer = document.createElement('i');
		closer.className = `closer ${this.closeIconSelector}`;

		let prevArrow = document.createElement('a');
		prevArrow.className = `zoomer-arrow prev ${this.prevIconSelector}`;
		prevArrow.addEventListener('click', this.prev.bind(this));

		let nextArrow = document.createElement('a');
		nextArrow.className = `zoomer-arrow next ${this.nextIconSelector}`;
		nextArrow.addEventListener('click', this.next.bind(this));

		// Создание тени
		let srcTop:number, srcLeft:number, srcWidth:number, srcHeight:number;
		let rect = el.getBoundingClientRect();
		srcTop = rect.top;
		srcLeft = rect.left;
		srcWidth = rect.width;
		srcHeight = rect.height;

		let transitionMs = <string>(this.transitionS + 's');

		let shadowImg = document.createElement('div');
		$(shadowImg).css({
			backgroundImage: 'url('+image+')',
			backgroundSize: 'contain',
			backgroundRepeat: 'no-repeat',
			backgroundPosition: 'center center',
			position: 'fixed',
			top: srcTop,
			left: srcLeft,
			width: srcWidth,
			height: srcHeight,
			zIndex: 1000,
			opacity: 0,
			transition: `top ${transitionMs}, left ${transitionMs}, width ${transitionMs}, height ${transitionMs}, opacity ${transitionMs}`
		});

		// Формируем оболочку для текущего, предыдущего и следующего слайдера
		let prevSlide = document.createElement('div');
		let nextSlide = document.createElement('div');
		let currentSlide = document.createElement('div');
		prevSlide.className = 'zoomer-slide zoomer-prev';
		currentSlide.className = 'zoomer-slide zoomer-current';
		nextSlide.className = 'zoomer-slide zoomer-next';

		prevSlide.appendChild(prevImgEl);
		nextSlide.appendChild(nextImgEl);
		currentSlide.appendChild(currentImgEl);

		slideboxWrapper.appendChild(closer);
		slideboxWrapper.appendChild(prevArrow);
		slideboxWrapper.appendChild(nextArrow);

		slidebox.append(...[prevSlide, currentSlide, nextSlide]);
		slideboxWrapper.appendChild(slidebox);
		document.body.appendChild(slideboxWrapper);

		setTimeout(() => {
			slideboxWrapper.classList.add('open');
			let targetWidth:number, targetHeight:number, targetLeft:number, targetTop:number;
			let destRect = slidebox.getBoundingClientRect();
			targetWidth = destRect.width;
			targetHeight = destRect.height;
			targetLeft = destRect.left;
			targetTop = destRect.top;
			
			document.body.appendChild(shadowImg);

			setTimeout(() => {
				$(shadowImg).css({
					top:targetTop,
					left:targetLeft,
					width:targetWidth,
					height:targetHeight,
					opacity: 1
				});

				setTimeout(() => {
					slidebox.style.opacity = '1';
					this.isAnimating = false;
					shadowImg.remove();
				}, this.transitionMs)
			}, 80);
		}, 80);
		slidebox.scrollLeft = currentImgEl.clientWidth;

		// Задаём события
		slidebox.addEventListener('mousedown', this.startDrag.bind(this));
		slidebox.addEventListener('mousemove', this.moveDrag.bind(this));
		slidebox.addEventListener('mouseup', this.endDrag.bind(this));

		slidebox.addEventListener('touchstart', this.touchStart.bind(this), true);
		slidebox.addEventListener('touchmove', this.touchMove.bind(this), true);
		slidebox.addEventListener('touchend', this.touchEnd.bind(this), true);

		slidebox.addEventListener('mouseleave', this.abortDrag.bind(this));
		closer.addEventListener('click', this.close.bind(this));
		document.body.addEventListener('keyup', this.keyboardReact.bind(this), true);

		window.addEventListener('resize', this.updateWidth.bind(this));
		$(window).on('scroll', this.close.bind(this));
	}

	startDrag(e:MouseEvent)
	{
		this.startX = e.clientX;
		this.startY = e.clientY;
		this.isDragging = true;
	}

	abortDrag(e:MouseEvent)
	{
		if(this.isDragging){

			let el = <HTMLDivElement>e.currentTarget;
			this.isDragging = false;
			this.startX = null;
			this.startY = null;
	
			$('.zoomer-viewer').animate({
				scrollLeft: el.clientWidth
			}, this.transitionMs, null);
		}
	}

	moveDrag(e:MouseEvent)
	{
		let el = <HTMLDivElement>e.currentTarget;
		let width = el.clientWidth;
		if(this.isDragging){
			let currentX = this.startX - e.clientX + width;
			(<HTMLDivElement>el).scrollLeft = currentX;
		}
	}

	endDrag(e:MouseEvent)
	{

		this.isDragging = false;

		let diff = Math.abs(e.clientX - this.startX);
		if(diff == 0) return
		let el = <HTMLDivElement>e.currentTarget;


		if(e.clientX < this.startX){
			$('.zoomer-viewer').animate({
				scrollLeft: el.clientWidth * 2
			}, this.transitionMs, null, this.afterMatch.bind(this));
		}else{
			$('.zoomer-viewer').animate({
				scrollLeft: 0
			}, this.transitionMs, null, this.afterMatch.bind(this));
		}

		this.startX = null;
		this.startY = null;
	}

	touchStart(e:TouchEvent)
	{
		let touch = e.touches[0];
		this.startX = touch.clientX;
		this.startY = touch.clientY;
		this.isDragging = true;
	}

	touchMove(e:TouchEvent)
	{
		let touch = e.touches[0];
		let el = <HTMLDivElement>e.currentTarget;
		let width = el.clientWidth;
		if(this.isDragging){
			let currentX = this.startX - touch.clientX + width;
			(<HTMLDivElement>el).scrollLeft = currentX;
		}
	}

	touchEnd(e:TouchEvent)
	{
	
		this.isDragging = false;
		let touch = e.changedTouches[0];

		let diff = Math.abs(touch.clientX - this.startX);
		if(diff == 0) return
		let el = <HTMLDivElement>e.currentTarget;


		if(touch.clientX < this.startX){
			$('.zoomer-viewer').animate({
				scrollLeft: el.clientWidth * 2
			}, this.transitionMs, null, this.afterMatch.bind(this));
		}else{
			$('.zoomer-viewer').animate({
				scrollLeft: 0
			}, this.transitionMs, null, this.afterMatch.bind(this));
		}

		this.startX = null;
		this.startY = null;
	}

	afterMatch()
	{

		let zoomer = document.querySelector('.zoomer-viewer');

		if(!zoomer){ return; }

		let direction = document.querySelector('.zoomer-viewer').scrollLeft == 0 ? 'prev' : 'next';
		let newCurrentEl = <HTMLImageElement>document.querySelector('.zoomer-' + direction+ ' img');
		let location = window.location.origin;
		let img = newCurrentEl.src.replace(location, '');
		let newCurrentIndex:number;
		if(direction == 'next'){
			newCurrentIndex = this.selectedIndex + 1;
			if( newCurrentIndex >= this.slides.length) newCurrentIndex = 0;
		}
		if(direction == 'prev'){
			newCurrentIndex = this.selectedIndex - 1;
			if (newCurrentIndex < 0) newCurrentIndex = this.slides.length - 1
		}
		
		this.selectedIndex = newCurrentIndex;

		let nextIndex = newCurrentIndex + 1;
		let prevIndex = newCurrentIndex - 1;

		if(nextIndex >= this.slides.length){ nextIndex = 0}
		if(prevIndex < 0){prevIndex = this.slides.length - 1}

		let nextSrc = this.slides[nextIndex];
		let prevSrc = this.slides[prevIndex];
		let currSrc = this.slides[newCurrentIndex];

		this.selectedIndex = newCurrentIndex;

		(<HTMLImageElement>document.querySelector('.zoomer-prev img')).src = prevSrc;
		(<HTMLImageElement>document.querySelector('.zoomer-next img')).src = nextSrc;
		(<HTMLImageElement>document.querySelector('.zoomer-current img')).src = currSrc;
		
		zoomer.scrollLeft = zoomer.clientWidth;
	}

	keyboardReact(e:KeyboardEvent)
	{
		switch(e.key){
			case 'Escape': this.close(); break;
			case 'ArrowLeft': this.prev(); break;
			case 'ArrowRight': this.next(); break;
		}
		e.stopImmediatePropagation();
	}

	next()
	{
		let zoomer = document.querySelector('.zoomer-viewer');
		let width = zoomer?.clientWidth;

		$(zoomer).animate({
			scrollLeft: width * 2
		}, this.transitionMs, null, this.afterMatch.bind(this))
	}

	prev()
	{
		let zoomer = document.querySelector('.zoomer-viewer');
		let width = zoomer?.clientWidth;

		$(zoomer).animate({
			scrollLeft: 0
		}, this.transitionMs, null, this.afterMatch.bind(this))
	}

	close()
	{
		
		let globalWrapper = document.querySelector('.zoomer-wrapper');
		if(!globalWrapper) return;

		if(!this.isAnimating){

			let zoomer = <HTMLDivElement>globalWrapper.querySelector('.zoomer-viewer');
			zoomer?.removeEventListener('mousedown', this.startDrag);
			zoomer?.removeEventListener('mousemove', this.moveDrag);
			zoomer?.removeEventListener('mouseup', this.endDrag);
	
			zoomer.addEventListener('touchstart', this.touchStart.bind(this));
			zoomer.addEventListener('touchmove', this.touchMove.bind(this));
			zoomer.addEventListener('touchend', this.touchEnd.bind(this));
	
			zoomer?.removeEventListener('mouseleave', this.abortDrag);
			globalWrapper?.removeEventListener('click', this.close);
			document.body.onkeyup = null;
	
			globalWrapper.classList.remove('open');
	
			
			let srcTop:number, srcLeft:number, srcWidth:number, srcHeight:number
	
			let rect = zoomer?.getBoundingClientRect();
			srcTop = rect?.top;
			srcLeft = rect?.left;
			srcWidth = rect?.width;
			srcHeight = rect?.height;
	
			let img = this.slides[this.selectedIndex];
	
			let transitionMs = <string>(this.transitionS + 's');

			let shadowImg = document.createElement('div');
			document.body.append(shadowImg);

			$(shadowImg).css({
				backgroundImage: 'url("'+img+'")',
				top: srcTop,
				left: srcLeft,
				width: srcWidth,
				height: srcHeight,
				position: 'fixed',
				backgroundSize:'contain',
				backgroundPosition: 'center center',
				backgroundRepeat: 'no-repeat',
				transition: `top ${transitionMs}, left ${transitionMs}, width ${transitionMs}, height ${transitionMs}, opacity ${transitionMs}`,
				zIndex:1000
			});

			zoomer.style.opacity = '0';
			this.isAnimating = true;
	
			let dest = this.slideElements[this.selectedIndex];
			let targetTop:number, targetLeft:number, targetWidth:number, targetHeight:number;
			let destRect = dest.getBoundingClientRect();
			targetTop = destRect.top;
			targetLeft = destRect.left;
			targetWidth = destRect.width;
			targetHeight = destRect.height;

			setTimeout(() => {
				$(shadowImg).css({
					top: targetTop,
					left:targetLeft,
					width:targetWidth,
					height:targetHeight,
					opacity: 0
				});

				setTimeout(() => {
					shadowImg.remove();
					globalWrapper?.remove();
					this.isAnimating = false;
				}, this.transitionMs);
			}, 80);
		}

	}

	updateWidth()
	{
		let el = <HTMLDivElement>document.querySelector('.zoomer-viewer');
		if(el){
			let width = el.clientWidth;
			el.scrollLeft = width;
		}
	}
}

export default Zoomer;