// Fetch Navbar
fetch('/src/components/navbar.html')
    .then(res => res.text())
    .then(html => {
        document.getElementById('navbar-container')!.innerHTML = html;
    });

// Fetch Footer
fetch("/src/components/footer.html")
    .then(res => res.text())
    .then(html => {
        document.getElementById('footer')!.innerHTML = html;
    });
