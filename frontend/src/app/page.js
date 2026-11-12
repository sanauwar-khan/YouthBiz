export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#home" aria-label="YouthBiz home">
          <span className="brand-mark" aria-hidden="true">Y</span>
          <span>YouthBiz</span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#club">The club</a>
        </nav>
        <div className="header-actions">
          <a className="login-link" href="/login">Log in</a>
          <a className="header-link" href="mailto:hello@youthbiz.club">Get in touch <span aria-hidden="true">↗</span></a>
        </div>
      </header>

      <section className="hero" id="home">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> A little business. A lot of possibility.</p>
          <h1>Big ideas start<br />with <span>small change.</span></h1>
          <p className="hero-description">A hands-on club where young people turn bright ideas into real businesses, and learn what it takes to make them work.</p>
          <div className="hero-actions">
            <a className="button button-dark" href="/register">Join the club <span aria-hidden="true">↗</span></a>
            <a className="text-link" href="#how-it-works">See what we do <span aria-hidden="true">↓</span></a>
          </div>
          <div className="hero-note"><span className="note-stars" aria-hidden="true">✳</span><span>Made for curious minds<br /><strong>Ages 8–17</strong></span></div>
        </div>

        <div className="hero-art" aria-label="A preview of a student business dashboard">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="spark spark-one" aria-hidden="true">✳</div>
          <div className="spark spark-two" aria-hidden="true">✦</div>
          <div className="dashboard-preview">
            <div className="preview-top"><span className="preview-title">My little business</span><span className="preview-menu">•••</span></div>
            <div className="business-label"><span className="business-icon">🌱</span><span><strong>Sprout &amp; Stem</strong><small>My plant stand</small></span><span className="live-dot" /></div>
            <div className="money-row">
              <div><small>Earned</small><strong>$128<span>.00</span></strong></div>
              <div><small>My profit</small><strong className="profit">$74<span>.50</span></strong></div>
            </div>
            <div className="chart" aria-label="Weekly sales trend">
              <div className="chart-head"><span>This week</span><span>+18%</span></div>
              <div className="chart-bars" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
              <div className="chart-days" aria-hidden="true"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
            </div>
            <div className="inventory-line"><span className="inventory-flower" aria-hidden="true">✿</span><span>Mini succulent</span><strong>8 left</strong></div>
          </div>
          <div className="floating-tag"><span className="tag-icon" aria-hidden="true">↗</span><span><small>Goal reached</small><strong>$100 <em>+28%</em></strong></span></div>
          <div className="art-caption">A real idea.<br /><strong>Real-world skills.</strong></div>
        </div>
      </section>

      <section className="steps-section" id="how-it-works">
        <div className="section-heading"><p className="eyebrow">Learning by doing</p><h2>From “what if?” to <span>“I did it.”</span></h2></div>
        <div className="steps-grid">
          <article className="step"><span className="step-number">01</span><span className="step-icon idea-icon" aria-hidden="true">✳</span><h3>Dream it up</h3><p>Pick an idea, find your people, and sketch out the first version of your business.</p></article>
          <article className="step"><span className="step-number">02</span><span className="step-icon make-icon" aria-hidden="true">◒</span><h3>Make it real</h3><p>Create something worth sharing. Keep track of your materials, stock, and costs.</p></article>
          <article className="step"><span className="step-number">03</span><span className="step-icon grow-icon" aria-hidden="true">↗</span><h3>See it grow</h3><p>Make your first sale, understand the numbers, and pitch what comes next.</p></article>
        </div>
      </section>

      <footer id="club"><a className="brand" href="#home"><span className="brand-mark" aria-hidden="true">Y</span><span>YouthBiz</span></a><p>Good ideas grow here.</p><span className="footer-year">A club for future founders</span></footer>
    </main>
  );
}
