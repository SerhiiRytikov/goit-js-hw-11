import './styles.css';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import axios from 'axios';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
var lightbox = new SimpleLightbox('.gallery a', { captionsData: 'alt' });

const refs = {
  searchForm: document.querySelector('#search-form'),
  loadBtn: document.querySelector('.load-more'),
  gallery: document.querySelector('.gallery'),
};

let searchQuery = '';
let page = 1;

refs.searchForm.addEventListener('submit', onSearch);
window.addEventListener('scroll', () => {
  const { scrollHeight, scrollTop, clientHeight } = document.documentElement;
  if (scrollTop + clientHeight > scrollHeight - 5) {
    onLoadMore();
  }
});

async function onSearch(event) {
  event.preventDefault();

  searchQuery = event.currentTarget.searchQuery.value.trim(); // Видаляємо зайві пробіли з початку і кінця рядка
  if (!searchQuery) {
    // Перевірка на пустий рядок
    Notify.failure('Please enter a search query.');
    return;
  }

  resetPage();

  try {
    const response = await axios.get(
      `https://pixabay.com/api/?key=36616825-90ae0210fb817fe2b1f6bb41c&q=${searchQuery}&image_type=photo&orientation=horizontal&safesearch=true&per_page=40&page=1`
    );

    const { data } = response;

    if (data.hits.length > 0) {
      Notify.success(`Hooray! We found ${data.totalHits} images.`);
    } else {
      Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
      return;
    }

    createMarkup(data.hits);
    lightbox.refresh();
    page += 1;
  } catch (error) {
    console.error(error);
  }
}

let isLoading = false;

async function onLoadMore() {
  if (isLoading || !searchQuery) {
    return;
  }

  isLoading = true;

  try {
    const response = await axios.get(
      `https://pixabay.com/api/?key=36616825-90ae0210fb817fe2b1f6bb41c&q=${searchQuery}&image_type=photo&orientation=horizontal&safesearch=true&per_page=40&page=${page}`
    );

    const { data } = response;

    if (data.hits.length === 0) {
      Notify.info("We're sorry, but you've reached the end of search results.");
      return;
    }

    Notify.success(`Hooray! We found ${data.totalHits} images.`);
    createMarkup(data.hits);
    lightbox.refresh();

    const { totalHits, hits } = data;
    const remainingHits = totalHits - page * 40;

    if (remainingHits <= 0) {
      Notify.info("We're sorry, but you've reached the end of search results.");
      return;
    }

    page += 1;

    const { height: cardHeight } = document
      .querySelector('.gallery')
      .firstElementChild.getBoundingClientRect();

    window.scrollBy({
      top: cardHeight * 2 + 150,
      behavior: 'smooth',
    });
  } catch (error) {
    console.error(error);
  } finally {
    isLoading = false;
  }
}

function resetPage() {
  page = 1;
  refs.gallery.innerHTML = '';
}

function createMarkup(data) {
  const markup = data.map(
    item => `<div class="photo-card"><div class="photo-gallery"> <a  href="${item.largeImageURL}">
  <img src="${item.webformatURL}" alt="${item.tags}" loading="lazy" />  </a></div>
  <div class="info">
    <p class="info-item">
      <b>Likes</b>
      ${item.likes}
    </p>
    <p class="info-item">
      <b>Views</b>
      ${item.views}
    </p>
    <p class="info-item">
      <b>Comments</b>
      ${item.comments}
    </p>
    <p class="info-item">
      <b>Downloads</b>
      ${item.downloads}
    </p>
  </div>
</div>`
  );
  refs.gallery.insertAdjacentHTML('beforeend', markup.join(''));
}
