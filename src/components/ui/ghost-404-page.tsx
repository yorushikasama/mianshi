import Link from "next/link";

export function Ghost404Page() {
  return (
    <main className="ghost-404-page" aria-labelledby="ghost-404-title">
      <section className="ghost-404" aria-label="404">
        <div className="ghost-404__code" aria-hidden="true">
          <span className="ghost-404__number ghost-404__number--left">4</span>
          <span className="ghost-404__mark">
            <img
              className="ghost-404__image"
              src="https://xubohuah.github.io/xubohua.top/Group.png"
              alt=""
              draggable={false}
            />
            <span className="ghost-404__shadow" />
          </span>
          <span className="ghost-404__number ghost-404__number--right">4</span>
        </div>

        <div className="ghost-404__copy">
          <p className="ghost-404__eyebrow">404 / ROUTE MISSING</p>
          <h1 id="ghost-404-title">页面走丢了</h1>
          <p>
            这条训练路径暂时不存在。先回到工作台，继续整理题库、生成候选题或进入练习。
          </p>
        </div>

        <div className="ghost-404__actions">
          <Link className="flow-button" href="/dashboard">
            <span className="flow-button__arrow flow-button__arrow--left" aria-hidden="true" />
            <span className="flow-button__text">返回工作台</span>
            <span className="flow-button__bubble" aria-hidden="true" />
            <span className="flow-button__arrow flow-button__arrow--right" aria-hidden="true" />
          </Link>
          <Link className="ghost-404__link" href="/generate">
            去生成题目
          </Link>
        </div>
      </section>
    </main>
  );
}
