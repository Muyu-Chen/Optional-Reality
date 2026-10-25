import { useId } from 'react';

/** Code-drawn title art, independent of the live physics world and its clock. */
export function TitleIllustration() {
  const id = useId();
  return <svg className="title-illustration" viewBox="0 0 800 680" role="img" aria-label="A little green ball leaps between floating islands, stars and an impossible doorway.">
    <defs>
      <linearGradient id={`${id}-sky`} x2=".4" y2="1"><stop stopColor="#a2d0c6" /><stop offset="1" stopColor="#f6edc9" /></linearGradient>
      <linearGradient id={`${id}-rock`} x2=".3" y2="1"><stop stopColor="#8caa8b" /><stop offset="1" stopColor="#3d7268" /></linearGradient>
      <radialGradient id={`${id}-ball`} cx=".3" cy=".2"><stop stopColor="#f7ffb2" /><stop offset=".5" stopColor="#c7e757" /><stop offset="1" stopColor="#7fb338" /></radialGradient>
      <linearGradient id={`${id}-door`} x2="1" y2="1"><stop stopColor="#366f58" /><stop offset="1" stopColor="#193e39" /></linearGradient>
      <clipPath id={`${id}-clip`}><path d="M400 35C550 8 718 111 755 276c41 181-51 326-205 353C368 662 181 655 97 501 21 361 73 184 194 103 264 56 332 48 400 35Z" /></clipPath>
    </defs>
    <g clipPath={`url(#${id}-clip)`}>
      <path fill={`url(#${id}-sky)`} d="M0 0h800v680H0z" />
      <circle cx="580" cy="164" r="87" fill="#fff5c9" opacity=".75" />
      <circle cx="580" cy="164" r="112" fill="none" stroke="#fff5c9" strokeWidth="20" opacity=".25" />
      <path d="M-30 395 134 235 263 373 403 191 624 390 729 263 872 444v253H-30Z" fill="#80b2a8" opacity=".5" />
      <path d="m251 386 152-195 102 113-102-60-47 71-28-9Z" fill="#edf2d5" opacity=".45" />
      <path d="M-40 516Q81 385 229 477T470 460q163-100 364 15v230H-40Z" fill="#77a18b" opacity=".4" />
      <path d="M-10 595Q122 470 317 548T821 534v180H-10Z" fill="#c2c59c" />
      <g fill="#fff9e7" opacity=".86">
        <path className="title-cloud title-cloud--one" d="M96 183c-31-5-27-28-4-30 7-27 40-31 55-9 25-5 42 9 36 23 31 13 20 25-10 25H96Z" />
        <path className="title-cloud title-cloud--two" d="M520 337c-31-6-23-28-1-29 15-29 53-24 62-4 24-2 42 14 33 25 36 6 32 24 1 25H520Z" />
      </g>
      <g className="title-island title-island--start">
        <path d="m87 424 42 109 62 34 63-64 27-79Z" fill={`url(#${id}-rock)`} />
        <path d="m117 437 17 83 22 15-7-83m61-13-12 75 32-35 15-42" fill="#d3d5a9" opacity=".32" />
        <ellipse cx="184" cy="425" rx="104" ry="31" fill="#5a8d69" />
        <path d="M82 416q101-50 205 3" fill="none" stroke="#aace86" strokeWidth="17" strokeLinecap="round" />
        <path d="M119 399v-18m-5 8 5 5 7-9m117 20v-16m-7 3 7 7 5-10" stroke="#44765a" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M250 441c-4 38 22 77 4 109s-8 64-5 86" stroke="#caeee4" strokeWidth="15" opacity=".65" fill="none" />
        <path d="M250 448c0 41 21 73 5 102s-7 57-7 65" stroke="#f1fff4" strokeWidth="3" opacity=".8" fill="none" />
      </g>
      <path d="M193 390C273 169 407 169 502 342" fill="none" stroke="#fffcdd" strokeWidth="5" strokeLinecap="round" strokeDasharray="2 17" />
      <g className="title-island title-island--exit">
        <path d="m469 380 29 96 49 65 55-63 61-98Z" fill={`url(#${id}-rock)`} />
        <path d="m501 393 42 118 17-53 26-53" fill="#d6dbb5" opacity=".27" />
        <ellipse cx="565" cy="380" rx="103" ry="27" fill="#608f6b" />
        <path d="M468 372q94-39 193 0" stroke="#b2d08a" strokeWidth="15" strokeLinecap="round" fill="none" />
        <path d="M535 361V257a37 37 0 0 1 74 0v104Z" fill={`url(#${id}-door)`} stroke="#e3d282" strokeWidth="5" />
        <path d="M545 350v-91a27 27 0 0 1 54 0v91Z" fill="none" stroke="#91b796" strokeWidth="2" />
        <path d="M552 301h39m-14-14 14 14-14 14" fill="none" stroke="#fff9dc" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g className="title-ball"><circle cx="354" cy="243" r="29" fill="#365d47" opacity=".18" transform="translate(2 6)" />
        <circle cx="354" cy="243" r="28" fill={`url(#${id}-ball)`} stroke="#2b5339" strokeWidth="4" />
        <circle cx="345" cy="231" r="7" fill="#fcffe0" /></g>
      <g fill="#ffd267" stroke="#ad7f28" strokeWidth="3" strokeLinejoin="round">
        <path className="title-star title-star--one" d="m278 251 6 13 15 2-11 11 3 15-13-7-13 7 3-15-11-11 15-2Z" />
        <path className="title-star title-star--two" d="m430 213 6 13 15 2-11 11 3 15-13-7-13 7 3-15-11-11 15-2Z" />
        <path className="title-star title-star--three" d="m484 290 6 13 15 2-11 11 3 15-13-7-13 7 3-15-11-11 15-2Z" />
      </g>
      <g stroke="#46776b" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".6"><path d="M190 246q8-8 16 0 8-8 16 0m393-35q6-7 12 0 6-7 12 0" /></g>
    </g>
    <g className="title-rule-bubble" transform="translate(414 508)">
      <rect width="267" height="68" rx="19" fill="#214e43" stroke="#e6eed1" strokeWidth="3" />
      <path d="m31 65 15 20 13-20" fill="#214e43" />
      <text x="23" y="29" fill="#bbd9c1" fontSize="12" fontWeight="800" letterSpacing="1.3">A NEW POSSIBILITY</text>
      <text x="23" y="51" fill="#fff7d5" fontSize="20" fontWeight="750">“Reverse gravity.” ↑</text>
    </g>
    <g fill="#e8b94e"><path d="m110 104 3 10 10 3-10 3-3 10-3-10-10-3 10-3Zm586 327 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z" /><circle cx="276" cy="55" r="4" /><circle cx="704" cy="242" r="4" /></g>
  </svg>;
}
