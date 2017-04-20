/* global dataSet */

var $table = document.querySelector("#ufo-table");
var $loader = document.querySelector(".loader");
var $pagination = document.querySelector(".pagination");
var $tbody = document.getElementsByTagName("tbody")[0];
var $countrySearch = document.querySelector("#country-search");
var $shapeSearch = document.querySelector("#shape-search");
var $dateSearch = document.querySelector("#date-search");
var $citySearch = document.querySelector("#city-search");
var $stateSearch = document.querySelector("#state-search");
var $numResults = document.querySelector("#num-results");
var $filterBtn = document.querySelector("#filter-submit");

$pagination.addEventListener("click", changePage);
$filterBtn.addEventListener("click", filterData);

var filter = {
  datetime: function() {
    return $dateSearch.value.trim();
  },
  city: function() {
    return $citySearch.value.trim();
  },
  state: function() {
    return $stateSearch.value.trim();
  },
  country: function() {
    return $countrySearch.value.trim();
  },
  shape: function() {
    return $shapeSearch.value.trim();
  },
  resultsPerPage: function() {
    return $numResults.value.trim();
  }
};

var data = {
  dataLength: dataSet.length,
  dataSet: dataSet,
  filtered: dataSet,
  filteredLength: dataSet.length,
  filterData: function() {
    var filterKeys = Object.keys(filter);
    filterKeys.pop();
    var filteredData = dataSet.filter(function(data) {
      for (var i = 0; i < filterKeys.length; i++) {
        if (!fuzzySearch(data[filterKeys[i]], filter[filterKeys[i]]())) {
          return false;
        }
      }
      return true;
    });
    this.filteredLength = filteredData.length;
    this.filtered = filteredData;
  }
};

function fuzzySearch(source, target) {
  var slicedSource = source.slice(0, target.length);
  if (target === slicedSource) {
    return true;
  }
  return false;
}

var page = {
  currentPage: 1,
  numPages: function() {
    return Math.ceil(data.filteredLength / filter.resultsPerPage());
  },
  getPageSubset: function() {
    var start;
    if (this.currentPage < 11) {
      start = 1;
    }
    else {
      start = Math.floor(this.currentPage / 10) * 10;
    }
    // fix pagination

    var i = start;
    var subset = [start];
    i++;

    while (subset[subset.length - 1] <= this.numPages() && subset.length < 10) {
      subset.push(i);
      i++;
    }
    return subset;
  },
  paginate: function(array, pageSize, pageNumber) {
    pageNumber--;
    return array.slice(pageNumber * pageSize, (pageNumber + 1) * pageSize);
  }
};

init();

function init() {
  loadDropdown();
  loadTable();
  appendPagination();
}

function filterData() {
  data.filterData();
  loadTable();
  appendPagination();
}

function loadDropdown() {
  // dropdownOptions will be used to construct HTML for the country and shape dropdown menus
  // Each gets one option HTML tag for each category in in the dataSet
  var dropdownOptions = {
    country: ["<option default value=''>all</option>"],
    shape: ["<option default value=''>all</option>"]
  };

  // optionKeys is an array containing the keys in the dropdownOptions object as strings
  var optionKeys = Object.keys(dropdownOptions);

  // For each object in the dataSet, loop through each object in dropdownOptions
  // This code goes through each object in the dataset, and creates an HTML tag string for a dropdown option containing the data's country and shape
  for (var i = 0; i < data.dataLength; i++) {
    var element = data.dataSet[i];
    for (var j = 0; j < optionKeys.length; j++) {
      var option = optionKeys[j];
      var optionHTML =
        "<option value='" +
        element[option] +
        "'>" +
        element[option] +
        "</option>";
      // If the country and shape option is not already inside dropdownOptions.country or dropdownOptions.state, add it to the appropriate array
      if (dropdownOptions[option].indexOf(optionHTML) < 0) {
        dropdownOptions[option].push(optionHTML);
      }
    }
  }
  // Render the array of country HTML option tags to the countrySearch select box on the page
  $countrySearch.innerHTML = dropdownOptions.country.join("");
  // Render the array of shape HTML option tags to the shapeSearch select box on the page
  $shapeSearch.innerHTML = dropdownOptions.shape.join("");
}

function changePage(event) {
  // Any time a function is called as the result of an event in the DOM, an event object containing information about the event is passed through as an argument
  // event.preventDefault() prevents the default behavior of the action which triggered the event.
  // This event was triggered by clicking an anchor tag (one of the buttons in the pagination component).
  // By preventing the event's default behavior, we stop the browser from trying to navigate to another page
  event.preventDefault();
  // Getting a reference to the anchor tag which was clicked on and triggered the event, getting the href attribute of the anchor tag
  var paginationBtn = event.target;
  var newPageNumber = parseInt(paginationBtn.getAttribute("href"));
  // If the newPageNumber is less than 1 or more than the maximum number of pages available with this dataset, return and end the function. There is no page to go backwards to forwards to
  if (
    newPageNumber < 1 || newPageNumber > Math.ceil(data.filteredLength / filter.resultsPerPage())
  ) {
    return false;
  }
  // Otherwise the page.currentPage to the newPageNumber
  page.currentPage = newPageNumber;
  // If the clicked paginationBtn has a class of "page-direction", then it means it's one of the arrow pagination buttons, which means we need to load the next or previous set of pagination buttons (they come in a subset of 10)
  if (paginationBtn.getAttribute("class") === "page-direction") {
    // appendPagination completely replaces all the buttons inside the pagination component with new buttons
    appendPagination();
  }
  else {
    // setActivePage doesn't replace all of the buttons, but instead just applies the "active" class to the correct button. This gives the active button it's orange color
    setActivePage();
  }
  // Whether we need to reload the entire pagination component or not, reload the table when done
  loadTable();
}

// This function uses the page.currentPage variable to determine which pagination button should have the "active" class
function setActivePage() {
  for (var i = 0; i < $pagination.children.length; i++) {
    var li = $pagination.children[i];
    if (parseInt(li.children[0].getAttribute("href")) === page.currentPage) {
      li.classList = "active";
    }
    else {
      li.classList = "";
    }
  }
}

// appendPagination completely replaces the current pagination component
function appendPagination() {
  // Empty the pagination component
  $pagination.innerHTML = "";
  // A document fragment is a minimal document object stored in memory. We can append elements to the fragment, building a document subtree, and then append the entire fragment to the DOM at once
  // This often results in better performance since all of the DOM nodes are interted at once, instead of potentially rendering each node one at a time
  var fragment = document.createDocumentFragment();
  // pageSubset is an array containing the pageNumbers which should appear in the pagination component at this current page number
  var pageSubset = page.getPageSubset();
  var listItem;
  var backButton;
  var forwardButton;
  // Create an li tag, which will contain HTML to create the back button on the pagination component. Append the back button to the fragment
  backButton = document.createElement("li");
  backButton.innerHTML =
    "<a class='page-direction' href='" + (pageSubset[0] - 1) + "'><</a>";
  fragment.appendChild(backButton);

  // For every element in the pageSubset, create an li tag, containing an anchor tag with an href attribute of the page number the pagination button should take the user to when clicked
  for (var i = 0; i < pageSubset.length; i++) {
    listItem = document.createElement("li");
    listItem.innerHTML =
      "<a href='" + pageSubset[i] + "'>" + pageSubset[i] + "</a>";
    if (pageSubset[i] === page.currentPage) {
      listItem.classList = "active";
    }
    fragment.appendChild(listItem);
  }

  // Append a forwardButton to the fragment
  forwardButton = document.createElement("li");
  forwardButton.classList = "page-direction";
  forwardButton.innerHTML =
    "<a class='page-direction' href='" +
    (pageSubset[0] + pageSubset.length) +
    "'>></a>";
  fragment.appendChild(forwardButton);
  // Append the fragment to the pagination component
  $pagination.appendChild(fragment);
}

function loadTable() {
  // Clear the contents of the tbody on the page, start showing the loader
  $tbody.innerHTML = "";
  showLoader(true);
  // Create a fragment which will contain the new table before appending to the DOM
  var fragment = document.createDocumentFragment();
  // resultsThisPage is an array containing the slice of the data which should be rendered as a table on this page
  var resultsThisPage = page.paginate(
    data.filtered,
    filter.resultsPerPage(),
    page.currentPage
  );
  // Finish commenting
  for (var i = 0; i < resultsThisPage.length; i++) {
    var $row = $tbody.insertRow();
    $row.className = "table-row";
    var keys = Object.keys(resultsThisPage[i]);

    for (var j = 0; j < keys.length; j++) {
      var $cell = $row.insertCell(j);
      $cell.innerHTML = resultsThisPage[i][keys[j]];
      $cell.className = "text-center";
      $cell.setAttribute("data-th", keys[j]);
    }
  }

  fragment.appendChild($tbody);
  $table.appendChild(fragment);
  showLoader(false);
}

function showLoader(shouldLoad) {
  if (!shouldLoad) {
    $table.style.visibility = "visible";
    $loader.style.display = "none";
  }
  else {
    $table.style.visibility = "hidden";
    $loader.style.display = "block";
  }
}
