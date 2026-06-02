// ============ Modals / Action Flows / XPLA Debug Panel ============
const MAX_REVISION_REQUESTS = 2;
const APP_VERSION = 'dev-2026.06.02.6';
const TERMS_VERSION = '2026-06-draft';
const TERMS_OPERATOR_NAME = 'bounX 운영팀';
const TERMS_CONTACT = 'contact@example.com';
const TERMS_EFFECTIVE_DATE = '2026년 월 일';

const DELIVERABLE_TYPES = {
  public_link: {
    label: '공개 링크',
    hint: '공개 가능한 URL, 데모, 문서 링크를 결과물로 제출합니다.',
    submit: '접근 권한이 열려 있는 공개 URL을 제출하고, 요약에 확인 방법을 적어주세요.',
  },
  github: {
    label: 'GitHub PR / Repo',
    hint: 'PR, repository, commit, issue 링크를 결과물 기준으로 사용합니다.',
    submit: 'PR/Repo 링크와 테스트 결과, 리뷰 포인트를 요약에 함께 남겨주세요.',
  },
  document: {
    label: '문서 / 번역',
    hint: '문서 링크, 번역본, 리서치 결과를 제출합니다.',
    submit: '문서 접근 권한과 변경 요약을 확인해주세요. 민감한 원문은 비공개 제출을 사용하세요.',
  },
  design: {
    label: '디자인 / Figma',
    hint: 'Figma, 이미지, 화면 시안, 디자인 시스템 링크를 제출합니다.',
    submit: 'Figma/시안 링크와 포함된 화면 범위, 수정 기준을 요약에 적어주세요.',
  },
  media: {
    label: '영상 / 콘텐츠',
    hint: '영상, 게시글, SNS 콘텐츠, 썸네일 등을 제출합니다.',
    submit: '게시 URL, 원본 파일 전달 방식, 사용 권한/라이선스 메모를 남겨주세요.',
  },
  private_delivery: {
    label: '비공개 전달',
    hint: '원문, 계약서, 민감 문서처럼 공개 기록에 링크를 남기면 안 되는 작업입니다.',
    submit: '실제 링크는 기록하지 말고, 별도 채널로 전달한 사실과 검토 가능한 요약만 남겨주세요.',
  },
};

// ============ 등록 ============
function openCreateModal() { 
  ensureBountyVisibilityControls();
  ensureCreateQualityControls();
  document.getElementById('createModal').classList.remove('hidden'); 
  document.getElementById('createModal').classList.add('flex');
  // 옵션 초기화
  setTimeout(() => { updateBountyVisibility(); updateDeliverableTypeHint(); updateMatchingOption(); updatePaymentOption(); }, 50);
}
function closeCreateModal() { document.getElementById('createModal').classList.add('hidden'); document.getElementById('createModal').classList.remove('flex'); }

function getDeliverableTypeMeta(type) {
  return DELIVERABLE_TYPES[type] || DELIVERABLE_TYPES.public_link;
}

function parseDeliverableType(desc) {
  const match = (desc || '').match(/^\[결과물 유형:\s*([^\]]+)\]/m);
  if (!match) return { type: 'public_link', label: getDeliverableTypeMeta('public_link').label };
  const label = match[1].trim();
  const type = Object.keys(DELIVERABLE_TYPES).find(key => DELIVERABLE_TYPES[key].label === label) || 'public_link';
  return { type, label };
}

function updateDeliverableTypeHint() {
  const selected = document.querySelector('input[name="deliverableType"]:checked')?.value || 'public_link';
  const meta = getDeliverableTypeMeta(selected);
  document.querySelectorAll('#createQualitySection .deliverable-type-option').forEach(option => {
    const checked = option.closest('label')?.querySelector('input')?.checked;
    option.classList.toggle('border-violet-300', !!checked);
    option.classList.toggle('bg-violet-50', !!checked);
  });
  const hint = document.getElementById('deliverableTypeHint');
  if (hint) hint.textContent = meta.hint;
  if (selected === 'private_delivery') {
    const privateRadio = document.querySelector('input[name="bountyVisibility"][value="private"]');
    if (privateRadio) {
      privateRadio.checked = true;
      updateBountyVisibility();
    }
  }
}

function ensureCreateQualityControls() {
  if (document.getElementById('acceptanceCriteriaInput')) return;
  const descInput = document.getElementById('descInput');
  const visibilitySection = document.getElementById('bountyVisibilitySection');
  const target = visibilitySection || descInput?.closest('div');
  if (!target) return;
  const section = document.createElement('div');
  section.id = 'createQualitySection';
  section.className = 'space-y-2';
  section.innerHTML = `
    <div class="rounded-xl p-3 bg-white/10 border border-white/15 text-xs text-white/85">
      <div class="font-semibold text-white mb-1">등록 전에 정하면 좋은 기준</div>
      <div class="leading-relaxed">결과물 형식, 승인 기준, 수정 가능 범위를 미리 적어두면 나중에 승인/수정요청/분쟁이 훨씬 줄어듭니다.</div>
    </div>
    <div>
      <label class="block text-sm font-medium text-neutral-700 mb-2">결과물 유형</label>
      <div class="grid grid-cols-2 gap-2">
        ${Object.entries(DELIVERABLE_TYPES).map(([key, meta], idx) => `
          <label class="cursor-pointer">
            <input type="radio" name="deliverableType" value="${key}" ${idx === 0 ? 'checked' : ''} class="sr-only" onchange="updateDeliverableTypeHint()" />
            <div class="deliverable-type-option rounded-xl p-3 border border-neutral-200 bg-neutral-50">
              <div class="text-sm font-semibold text-neutral-800">${meta.label}</div>
            </div>
          </label>
        `).join('')}
      </div>
      <div id="deliverableTypeHint" class="mt-2 text-[11px] text-neutral-500 leading-relaxed">${DELIVERABLE_TYPES.public_link.hint}</div>
    </div>
    <div>
      <label class="block text-sm font-medium text-neutral-700 mb-1.5">검수 기준 / 결과물 기준</label>
      <textarea id="acceptanceCriteriaInput" class="input-field w-full px-3.5 py-2.5 rounded-xl text-sm resize-none" rows="3" placeholder="예: 1) 구글 문서 링크로 제출 2) 핵심 용어집 준수 3) 오탈자 검수 포함 4) 수정 요청은 마일스톤당 최대 2회"></textarea>
    </div>
  `;
  target.insertAdjacentElement('afterend', section);
}

function buildFinalDescription(desc, title, bountyVisibility, acceptanceCriteria, deliverableType) {
  let body = desc || title;
  const meta = getDeliverableTypeMeta(deliverableType);
  body = `[결과물 유형: ${meta.label}]\n${body}`;
  const criteria = (acceptanceCriteria || '').trim();
  if (criteria) {
    body += `\n\n[검수 기준 / 결과물 기준]\n${criteria}`;
  }
  if (bountyVisibility !== 'private') return body;
  return `[비공개 작업]\n민감한 원문/결과물 링크는 공개 기록에 남기지 말고, 승인된 작업자와 별도 채널로 공유하세요.\n\n${body}`;
}

function termsStorageKey(action) {
  return `bounx_terms_${TERMS_VERSION}_${action}`;
}

function hasAcceptedTerms(action) {
  try { return localStorage.getItem(termsStorageKey(action)) === 'accepted'; }
  catch (e) { return false; }
}

function markTermsAccepted(action) {
  try { localStorage.setItem(termsStorageKey(action), 'accepted'); } catch (e) {}
}

function ensureTermsConsentModal() {
  if (document.getElementById('termsConsentModal')) return;
  const modal = document.createElement('div');
  modal.id = 'termsConsentModal';
  modal.className = 'hidden fixed inset-0 z-[80] modal-backdrop items-center justify-center p-4';
  modal.innerHTML = `
    <div class="modal-content rounded-3xl w-full max-w-lg max-h-[86vh] overflow-y-auto shadow-2xl">
      <div class="p-6 border-b border-white/10">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <h3 id="termsConsentTitle" class="font-display text-xl font-bold tracking-tight text-white">약관 확인</h3>
              <span class="px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-300/30 text-[10px] font-bold text-sky-100">임시 정보 포함</span>
            </div>
            <p id="termsConsentSubtitle" class="text-xs text-white/60 leading-relaxed"></p>
          </div>
          <button onclick="closeTermsConsentModal()" class="text-white/45 hover:text-white"><svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
      </div>
      <div id="termsConsentBody" class="p-6"></div>
    </div>
  `;
  document.body.appendChild(modal);
}

function closeTermsConsentModal() {
  const modal = document.getElementById('termsConsentModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  window.pendingTermsAgree = null;
}

function getTermsConsentCopy(action) {
  if (action === 'create') {
    return {
      title: '바운티 등록 전 확인',
      subtitle: '보상 예치와 온체인 거래가 실행되기 전에 핵심 위험을 확인해주세요.',
      items: [
        '등록한 보상은 스마트 컨트랙트에 예치되며, 상태에 따라 취소나 환불이 제한될 수 있습니다.',
        '작업 내용, 검수 기준, 제출 형식이 불명확해서 생기는 분쟁은 원칙적으로 의뢰자가 부담합니다.',
        '운영자는 의뢰자와 수행자 간 계약의 직접 당사자가 아니며 결과물 품질이나 보상 결과를 보장하지 않습니다.',
        '온체인 거래는 실행 후 취소 또는 되돌림이 어렵고, 네트워크 수수료는 반환되지 않을 수 있습니다.',
      ],
      checkbox: '위 내용을 확인했고 바운티 등록 약관에 동의합니다.',
      button: '동의하고 등록 진행',
    };
  }
  return {
    title: '작업 신청 전 확인',
    subtitle: '작업 조건과 수행자 책임을 확인한 뒤 신청해주세요.',
    items: [
      '수행자는 바운티 조건, 마감일, 검수 기준, 정산 방식을 직접 확인해야 합니다.',
      '결과물이 조건에 미달하면 수정 요청, 거부 또는 분쟁 절차가 진행될 수 있습니다.',
      '제출물의 저작권, 라이선스, 개인정보, AI 생성물 오류와 제3자 권리 침해 책임은 수행자에게 있습니다.',
      '보상은 의뢰자 승인 또는 스마트 컨트랙트 조건에 따라 지급되며, 플랫폼이 지급 결과를 보장하지 않습니다.',
    ],
    checkbox: '작업 조건과 수행자 책임을 확인했고 약관에 동의합니다.',
    button: '동의하고 신청 진행',
  };
}

function openTermsConsent(action, onAgree) {
  ensureTermsConsentModal();
  const copy = getTermsConsentCopy(action);
  window.pendingTermsAgree = onAgree;
  document.getElementById('termsConsentTitle').textContent = copy.title;
  document.getElementById('termsConsentSubtitle').textContent = copy.subtitle;
  document.getElementById('termsConsentBody').innerHTML = `
    <div class="space-y-4">
      <div class="rounded-xl p-3 bg-sky-500/15 border border-sky-300/25 text-xs text-sky-50">
        <div class="font-semibold mb-1">임시 운영 정보</div>
        <div class="space-y-1 text-sky-50/85">
          <div>운영자: <span class="font-semibold text-white">${escapeHtml(TERMS_OPERATOR_NAME)}</span> <span class="ml-1 px-1.5 py-0.5 rounded bg-sky-300/20 text-[10px] text-sky-50">임시</span></div>
          <div>연락처: <span class="font-semibold text-white">${escapeHtml(TERMS_CONTACT)}</span> <span class="ml-1 px-1.5 py-0.5 rounded bg-sky-300/20 text-[10px] text-sky-50">임시</span></div>
          <div>시행일자: <span class="font-semibold text-white">${escapeHtml(TERMS_EFFECTIVE_DATE)}</span> <span class="ml-1 px-1.5 py-0.5 rounded bg-sky-300/20 text-[10px] text-sky-50">임시</span></div>
        </div>
      </div>
      <div class="rounded-xl p-3 bg-white/10 border border-white/15">
        <ul class="space-y-2 text-xs text-white/85 leading-relaxed">
          ${copy.items.map(item => `<li class="flex gap-2"><span class="text-white/45">•</span><span>${escapeHtml(item)}</span></li>`).join('')}
        </ul>
      </div>
      <a href="terms.html" target="_blank" rel="noopener noreferrer" class="block text-xs text-sky-100 underline underline-offset-4">전체 이용약관 초안 보기</a>
      <label class="flex items-start gap-2 rounded-xl p-3 bg-white/5 border border-white/10 cursor-pointer">
        <input id="termsConsentCheck" type="checkbox" class="mt-0.5" onchange="updateTermsConsentButton()" />
        <span class="text-xs text-white/85 leading-relaxed">${escapeHtml(copy.checkbox)}</span>
      </label>
      <div class="flex gap-2">
        <button onclick="closeTermsConsentModal()" class="flex-1 px-4 py-2.5 rounded-xl premium-secondary-btn font-semibold text-sm">취소</button>
        <button id="termsConsentConfirmBtn" onclick="confirmTermsConsent('${action}')" disabled class="flex-1 px-4 py-2.5 rounded-xl premium-btn text-white font-semibold text-sm opacity-45 cursor-not-allowed">${escapeHtml(copy.button)}</button>
      </div>
      <p class="text-[11px] text-white/45 leading-relaxed">본 문구는 법무 검토 전 서비스 적용을 위한 초안입니다. 실제 배포 전 운영 주체, 환불 정책, 분쟁 처리 및 컨트랙트 동작과 대조해야 합니다.</p>
    </div>
  `;
  const modal = document.getElementById('termsConsentModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function updateTermsConsentButton() {
  const checked = document.getElementById('termsConsentCheck')?.checked;
  const btn = document.getElementById('termsConsentConfirmBtn');
  if (!btn) return;
  btn.disabled = !checked;
  btn.classList.toggle('opacity-45', !checked);
  btn.classList.toggle('cursor-not-allowed', !checked);
}

function confirmTermsConsent(action) {
  if (!document.getElementById('termsConsentCheck')?.checked) return;
  const callback = window.pendingTermsAgree;
  markTermsAccepted(action);
  closeTermsConsentModal();
  if (typeof callback === 'function') callback();
}

function ensureBountyVisibilityControls() {
  if (document.getElementById('bountyVisibilitySection')) return;
  const descInput = document.getElementById('descInput');
  const descWrap = descInput?.closest('div');
  if (!descWrap) return;
  const section = document.createElement('div');
  section.id = 'bountyVisibilitySection';
  section.innerHTML = `
    <label class="block text-sm font-medium text-neutral-700 mb-2">공개 범위</label>
    <div class="grid grid-cols-2 gap-2">
      <label class="cursor-pointer">
        <input type="radio" name="bountyVisibility" value="public" checked class="sr-only" onchange="updateBountyVisibility()" />
        <div class="visibility-option rounded-xl p-3 border border-neutral-200 bg-neutral-50">
          <div class="text-sm font-semibold text-neutral-800">공개 작업</div>
          <div class="text-[11px] text-neutral-500 mt-1 leading-relaxed">결과물 링크를 공개 기록으로 검토할 수 있어요.</div>
        </div>
      </label>
      <label class="cursor-pointer">
        <input type="radio" name="bountyVisibility" value="private" class="sr-only" onchange="updateBountyVisibility()" />
        <div class="visibility-option rounded-xl p-3 border border-neutral-200 bg-neutral-50">
          <div class="text-sm font-semibold text-neutral-800">비공개 작업</div>
          <div class="text-[11px] text-neutral-500 mt-1 leading-relaxed">승인된 작업자와 별도 채널로 원문을 주고받아요.</div>
        </div>
      </label>
    </div>
    <div id="bountyVisibilityHint" class="mt-2 text-[11px] text-neutral-500 leading-relaxed"></div>
  `;
  descWrap.insertAdjacentElement('afterend', section);
}

function updateBountyVisibility() {
  const selected = document.querySelector('input[name="bountyVisibility"]:checked')?.value || 'public';
  document.querySelectorAll('#bountyVisibilitySection .visibility-option').forEach(option => {
    const checked = option.closest('label')?.querySelector('input')?.checked;
    option.classList.toggle('border-violet-300', !!checked);
    option.classList.toggle('bg-violet-50', !!checked);
  });
  const firstcome = document.querySelector('input[name="matchingType"][value="firstcome"]');
  const approval = document.querySelector('input[name="matchingType"][value="approval"]');
  const hint = document.getElementById('bountyVisibilityHint');
  if (selected === 'private') {
    if (approval) approval.checked = true;
    if (firstcome) firstcome.disabled = true;
    if (hint) hint.innerHTML = '비공개 작업은 선착순이 아니라 승인 필요 방식으로 고정됩니다. 제목과 설명도 온체인/공개 화면에 남을 수 있으니 민감한 원문이나 링크는 적지 마세요.';
  } else {
    if (firstcome) firstcome.disabled = false;
    if (hint) hint.innerHTML = '공개 작업은 결과물 링크가 제출 기록에 남을 수 있습니다. 공개해도 되는 링크만 사용하세요.';
  }
  updateMatchingOption();
}

function updatePreview() {
  const v = parseFloat(document.getElementById('rewardInput').value) || 0;
  document.getElementById('previewAgent').textContent = (v * 0.9).toFixed(1) + ' XPLA';
  document.getElementById('previewValidator').textContent = (v * 0.03).toFixed(1) + ' XPLA';
  document.getElementById('previewBurn').textContent = (v * 0.03).toFixed(1) + ' XPLA';
  document.getElementById('previewEco').textContent = (v * 0.04).toFixed(1) + ' XPLA';
  const needed = document.getElementById('previewNeeded');
  if (needed) needed.textContent = '~' + (v + TX_FEE_XPLA).toFixed(1) + ' XPLA';
  document.getElementById('previewTotal').textContent = v + ' XPLA';
  // 마일스톤 금액 다시 계산
  updateMilestoneSummary();
}
document.getElementById('rewardInput').addEventListener('input', updatePreview);

function updateMatchingOption() {
  const selected = document.querySelector('input[name="matchingType"]:checked');
  const hint = document.getElementById('matchingHint');
  if (!selected || !hint) return;
  if (selected.value === 'firstcome') {
    hint.innerHTML = '⚡ 빠르게 시작할 수 있어요. 정량적 작업에 적합 (번역, 데이터 정제 등)';
  } else {
    hint.innerHTML = '🎯 지원자를 보고 작업자를 선택할 수 있어요. 정성적 작업에 적합 (디자인, 기획 등)';
  }
}

// 결제 방식 토글
function updatePaymentOption() {
  const selected = document.querySelector('input[name="paymentType"]:checked');
  const hint = document.getElementById('paymentHint');
  const section = document.getElementById('milestoneSection');
  if (!selected || !hint || !section) return;
  if (selected.value === 'lump') {
    hint.innerHTML = '💰 작업 완료 후 한 번에 정산해요. 빠르고 단순한 작업에 적합';
    section.classList.add('hidden');
  } else {
    hint.innerHTML = '🎯 마일스톤마다 결과 검토 후 단계별 정산. 큰 프로젝트에 적합 (디자인, 개발 등)';
    section.classList.remove('hidden');
    // 마일스톤이 비어있으면 기본 2개 생성
    const list = document.getElementById('milestoneList');
    if (list.children.length === 0) {
      addMilestone('초안', 40);
      addMilestone('최종안', 60);
    }
    updateMilestoneSummary();
  }
}

// 마일스톤 추가
function addMilestone(title = '', percent = 0) {
  const list = document.getElementById('milestoneList');
  const idx = list.children.length;
  const item = document.createElement('div');
  item.className = 'milestone-item';
  
  // 자동 퍼센트 계산 (남은 거 N등분)
  if (percent === 0) {
    const remaining = 100 - Array.from(list.querySelectorAll('.ms-percent')).reduce((s, el) => s + (parseInt(el.value) || 0), 0);
    percent = Math.max(remaining, 10);
  }
  
  item.innerHTML = `
    <div class="flex items-start gap-2 mb-2">
      <div class="milestone-step pending flex-shrink-0">${idx + 1}</div>
      <div class="flex-1 min-w-0">
        <input type="text" class="ms-title w-full" placeholder="마일스톤 제목 (예: 초안 제출)" value="${escapeHtml(title)}" maxlength="40" />
      </div>
      <button type="button" onclick="removeMilestone(this)" class="milestone-remove-btn flex-shrink-0">✕</button>
    </div>
    <div class="flex items-center gap-2">
      <label class="text-[11px] text-white/55">비율</label>
      <input type="number" class="ms-percent" style="width: 70px" value="${percent}" min="5" max="100" oninput="updateMilestoneSummary()" />
      <span class="text-[11px] text-white/55">%</span>
      <span class="text-[11px] text-white/45 ms-amount-display ml-auto"></span>
    </div>
  `;
  list.appendChild(item);
  updateMilestoneSummary();
}

// 마일스톤 삭제
function removeMilestone(btn) {
  const list = document.getElementById('milestoneList');
  if (list.children.length <= 1) {
    showToast('최소 1개 이상 필요해요');
    return;
  }
  btn.closest('.milestone-item').remove();
  // 번호 재정렬
  Array.from(list.querySelectorAll('.milestone-step')).forEach((el, i) => el.textContent = i + 1);
  updateMilestoneSummary();
}

// 마일스톤 합계 표시
function updateMilestoneSummary() {
  const list = document.getElementById('milestoneList');
  const summary = document.getElementById('milestoneSummary');
  const reward = parseFloat(document.getElementById('rewardInput').value) || 0;
  if (!summary) return;
  
  const percents = Array.from(list.querySelectorAll('.ms-percent')).map(el => parseInt(el.value) || 0);
  const total = percents.reduce((s, p) => s + p, 0);
  
  // 각 마일스톤 금액 표시
  Array.from(list.children).forEach((item, i) => {
    const amountEl = item.querySelector('.ms-amount-display');
    if (amountEl && reward > 0) {
      const amount = (reward * (percents[i] || 0) / 100).toFixed(1);
      amountEl.textContent = `${amount} XPLA`;
    } else if (amountEl) {
      amountEl.textContent = '';
    }
  });
  
  if (total === 100) {
    summary.innerHTML = `<span class="text-emerald-300">✓ 합계 ${total}% (정확함)</span>`;
  } else {
    summary.innerHTML = `<span class="text-amber-300">⚠️ 합계 ${total}% (100%가 되도록 조정해주세요)</span>`;
  }
}

function submitBounty(termsConfirmed = false) {
  if (!currentUser) { showWalletModal(); return; }
  const title = document.getElementById('titleInput').value.trim();
  const categoryId = document.getElementById('categoryInput').value;
  const desc = document.getElementById('descInput').value.trim();
  const acceptanceCriteria = document.getElementById('acceptanceCriteriaInput')?.value.trim() || '';
  const deliverableType = document.querySelector('input[name="deliverableType"]:checked')?.value || 'public_link';
  const reward = parseFloat(document.getElementById('rewardInput').value);
  const deadlineSelect = document.getElementById('deadlineInput').value;
  const bountyVisibility = document.querySelector('input[name="bountyVisibility"]:checked')?.value || 'public';
  let matchingType = document.querySelector('input[name="matchingType"]:checked')?.value || 'firstcome';
  const paymentType = document.querySelector('input[name="paymentType"]:checked')?.value || 'lump';
  if (bountyVisibility === 'private') matchingType = 'approval';

  if (!title) { showToast('제목을 입력해주세요'); return; }
  if (isNaN(reward) || reward <= 0) { showToast('보상 금액은 0보다 커야 해요'); return; }
  if (reward < 0.01) { showToast('최소 보상은 0.01 XPLA예요'); return; }
  const rewardStr = String(reward);
  if (rewardStr.includes('.') && rewardStr.split('.')[1].length > 6) { showToast('소수점 6자리까지만 입력 가능해요'); return; }

  const deadlineMap = { '12시간': 12*3600, '1일': 86400, '3일': 3*86400, '7일': 7*86400 };
  const deadlineSeconds = Math.floor(Date.now() / 1000) + (deadlineMap[deadlineSelect] || 14*86400);

  let milestoneInputs = [];
  if (paymentType === 'milestone') {
    const list = document.getElementById('milestoneList');
    const items = Array.from(list.children);
    if (items.length < 1) { showToast('마일스톤을 최소 1개 만들어주세요'); return; }
    let totalPercent = 0;
    for (let i = 0; i < items.length; i++) {
      const msTitle = items[i].querySelector('.ms-title').value.trim();
      const percent = parseInt(items[i].querySelector('.ms-percent').value) || 0;
      if (!msTitle) { showToast(`마일스톤 ${i + 1} 제목을 입력해주세요`); return; }
      if (percent < 5) { showToast(`마일스톤 ${i + 1} 비율은 최소 5% 이상`); return; }
      totalPercent += percent;
      milestoneInputs.push({ title: msTitle, percent: percent });
    }
    if (totalPercent !== 100) { showToast(`마일스톤 합계가 100%여야 해요 (현재 ${totalPercent}%)`); return; }
  }

  const contractMatchingType = matchingType === 'firstcome' ? 'first_come' : 'approval';
  const finalDescription = buildFinalDescription(desc, title, bountyVisibility, acceptanceCriteria, deliverableType);
  const executeMsg = {
    create_bounty: {
      title: title,
      description: finalDescription,
      category: categoryId,
      external_link: null,
      deadline: deadlineSeconds,
      matching_type: contractMatchingType,
      payment_type: paymentType,
      milestones: milestoneInputs,
    }
  };

  const axplaAmount = xplaToAxpla(String(reward));
  if (!termsConfirmed && !hasAcceptedTerms('create')) {
    openTermsConsent('create', () => submitBounty(true));
    return;
  }
  closeCreateModal();
  executeContract(executeMsg, axplaAmount, '등록 완료!').catch(() => {});
}



function applyToBounty(bountyId, termsConfirmed = false) {
  if (!currentUser) { showWalletModal(); return; }
  const b = bounties[bountyId];
  if (!b || b.status !== 'open') { showToast('이미 신청된 바운티예요'); return; }
  if (b.requester === currentUser.address) { showToast('자기 바운티에는 신청할 수 없어요'); return; }

  if (!termsConfirmed && !hasAcceptedTerms('apply')) {
    openTermsConsent('apply', () => applyToBounty(bountyId, true));
    return;
  }
  const matchingType = b.matchingType || 'firstcome';
  if (matchingType === 'approval') {
    openApplyMessageModal(bountyId);
  } else {
    const executeMsg = { apply_to_bounty: { bounty_id: b.numId, message: 'I want to work on this bounty' } };
    executeContract(executeMsg, '0', '신청 완료!').catch(() => {});
  }
}

function openApplyMessageModal(bountyId) {
  const b = bounties[bountyId];
  if (!b) return;

  let html = '<div class="space-y-4">';
  html += `<div class="comment-area rounded-xl p-3.5"><div class="text-xs text-white/55 mb-1">${getCategoryById(b.categoryId).icon} ${getCategoryById(b.categoryId).name} · 🎯 승인 필요</div><div class="font-semibold text-white text-sm">${escapeHtml(b.title)}</div></div>`;
  html += '<div class="bg-white/10 rounded-xl p-3 text-xs text-white/85 border border-white/15"><div class="font-semibold text-white mb-1">지원 메시지에 포함하면 좋은 내용</div><div class="leading-relaxed">가능 일정, 작업 방식, 관련 경험, 확인이 필요한 질문을 함께 적으면 의뢰자가 비교하기 쉽습니다.</div></div>';
  html += '<div><label class="block text-sm font-medium text-neutral-700 mb-1.5">지원 메시지</label><textarea id="applyMessageInput" class="input-field w-full px-3.5 py-2.5 rounded-xl text-sm resize-none" rows="5" placeholder="예: 1) 3일 안에 초안 제출 가능 2) 관련 번역 경험 있음 3) 결과물은 구글 문서로 전달 4) 원문 용어집이 있다면 먼저 확인하고 싶습니다."></textarea></div>';
  html += '<div class="bg-violet-50/10 rounded-xl p-3 text-xs border border-violet-100/30"><div class="font-semibold text-violet-200 mb-1">🎯 승인 대기</div><div class="text-white/60 leading-relaxed">의뢰자가 지원자 중에서 작업자를 선택합니다. 선정 전에는 보상이 지급되지 않고, 선정 후 작업 진행 상태로 바뀝니다.</div></div>';
  html += '<div class="flex gap-2">';
  html += '<button onclick="closeApplyModal()" class="flex-1 px-4 py-2.5 rounded-xl premium-secondary-btn font-semibold text-sm">취소</button>';
  html += `<button onclick="submitApplication('${b.id}')" class="flex-1 px-4 py-2.5 rounded-xl premium-btn text-white font-semibold text-sm">이 작업 지원하기</button>`;
  html += '</div></div>';
  
  document.getElementById('applyContent').innerHTML = html;
  document.getElementById('applyModal').classList.remove('hidden');
  document.getElementById('applyModal').classList.add('flex');
}

function closeApplyModal() {
  document.getElementById('applyModal').classList.add('hidden');
  document.getElementById('applyModal').classList.remove('flex');
}

function openMyApplication(bountyId) {
  const b = bounties[bountyId];
  if (!b || !b.myApplication) {
    showToast('지원 내용을 아직 불러오지 못했어요');
    return;
  }
  const appliedAt = b.myApplication.applied_at ? timeAgo(b.myApplication.applied_at * 1000) : '확인 중';
  let html = '<div class="space-y-4">';
  html += `<div class="comment-area rounded-xl p-3.5"><div class="text-xs text-white/55 mb-1">${getCategoryById(b.categoryId).icon} ${getCategoryById(b.categoryId).name} · 지원 완료</div><div class="font-semibold text-white text-sm">${escapeHtml(b.title)}</div></div>`;
  html += `<div class="bg-white/10 rounded-xl p-3 text-xs text-white/85 border border-white/15"><div class="font-semibold text-white mb-1">내 지원 상태</div><div>의뢰자의 선택을 기다리는 중입니다. 선택되면 작업 진행 상태로 바뀝니다.</div><div class="mt-1 text-white/55">지원 시점: ${appliedAt}</div></div>`;
  html += `<div><label class="block text-sm font-medium text-neutral-700 mb-1.5">내가 보낸 지원 메시지</label><div class="bg-neutral-50 rounded-xl p-3.5 text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">${escapeHtml(b.myApplication.message || '메시지 없음')}</div></div>`;
  html += '<div class="flex gap-2">';
  html += `<button onclick="closeApplyModal(); openDetail('${b.id}')" class="flex-1 px-4 py-2.5 rounded-xl premium-secondary-btn font-semibold text-sm">바운티 보기</button>`;
  html += '<button onclick="closeApplyModal()" class="flex-1 px-4 py-2.5 rounded-xl premium-btn text-white font-semibold text-sm">확인</button>';
  html += '</div></div>';
  document.getElementById('applyContent').innerHTML = html;
  document.getElementById('applyModal').classList.remove('hidden');
  document.getElementById('applyModal').classList.add('flex');
}

function submitApplication(bountyId) {
  const message = document.getElementById('applyMessageInput').value.trim();
  if (!message) { showToast('자기소개 메시지를 작성해주세요'); return; }
  if (message.length < 10) { showToast('조금 더 자세히 적어주세요 (10자 이상)'); return; }
  const b = bounties[bountyId];
  if (!b) return;
  const executeMsg = { apply_to_bounty: { bounty_id: b.numId, message: message } };
  closeApplyModal();
  executeContract(executeMsg, '0', '지원 완료!').catch(() => {});
}

async function openApplicantsModal(bountyId) {
  const b = bounties[bountyId];
  if (!b) return;
  const cat = getCategoryById(b.categoryId);

  document.getElementById('applicantsContent').innerHTML = '<div class="text-center py-8 text-white/55"><div class="text-sm">지원자 로딩 중...</div></div>';
  document.getElementById('applicantsModal').classList.remove('hidden');
  document.getElementById('applicantsModal').classList.add('flex');

  let applicantList = [];
  try { applicantList = await fetchApplicants(b.numId); } catch (e) { console.error(e); }

  let html = '<div class="space-y-3">';
  html += `<div class="comment-area rounded-xl p-3.5"><div class="text-xs text-white/55 mb-1">${cat.icon} ${cat.name} · 🎯 승인 필요</div><div class="font-semibold text-white text-sm">${escapeHtml(b.title)}</div></div>`;

  if (applicantList.length === 0) {
    html += '<div class="text-center py-8 text-white/55"><div class="text-3xl mb-2">🕊️</div><div class="text-sm">아직 지원자가 없어요</div><div class="text-xs mt-1">조금만 기다려주세요</div></div>';
  } else {
    html += `<div class="text-xs text-white/55 mb-2">총 <span class="text-white font-semibold">${applicantList.length}명</span>이 지원했어요. 한 명을 선택해주세요.</div>`;
    applicantList.forEach(a => {
      const workerAddr = a.worker;
      const shortAddr = workerAddr.slice(0, 8) + '...' + workerAddr.slice(-4);
      const avatarChar = shortAddr.slice(4, 5).toUpperCase();
      const avatarColors = ['bg-violet-100 text-violet-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-sky-100 text-sky-700'];
      const avatarColor = avatarColors[workerAddr.charCodeAt(6) % avatarColors.length];
      html += '<div class="applicant-card rounded-xl p-3.5">';
      html += '<div class="flex items-start gap-3 mb-2">';
      html += `<div class="w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center font-bold text-xs flex-shrink-0">${avatarChar}</div>`;
      html += '<div class="flex-1 min-w-0">';
      html += `<div class="flex items-center gap-2"><span class="font-mono text-sm font-semibold text-white">${shortAddr}</span><span class="text-xs text-white/45">·</span><span class="text-xs text-white/55">${timeAgo(a.applied_at * 1000)}</span></div>`;
      html += `<div class="text-xs text-white/72 mt-1.5 leading-relaxed">${escapeHtml(a.message)}</div>`;
      html += '</div></div>';
      html += `<button onclick="selectApplicant('${b.id}', '${workerAddr}', '${shortAddr}')" class="w-full mt-2 px-3 py-2 rounded-lg premium-btn text-white text-xs font-semibold">작업자로 선택하기</button>`;
      html += '</div>';
    });
  }
  html += '</div>';
  document.getElementById('applicantsContent').innerHTML = html;
}

function closeApplicantsModal() {
  document.getElementById('applicantsModal').classList.add('hidden');
  document.getElementById('applicantsModal').classList.remove('flex');
}

function selectApplicant(bountyId, workerAddress, workerShort) {
  if (!confirm(workerShort + ' 님을 작업자로 선택하시겠어요?')) return;
  const b = bounties[bountyId];
  if (!b) return;
  const executeMsg = { accept_applicant: { bounty_id: b.numId, selected_worker: workerAddress } };
  closeApplicantsModal();
  executeContract(executeMsg, '0', '작업자 선택 완료!').catch(() => {});
}

// comments removed — not available in contract

async function openDetail(bountyId) {
  const b = bounties[bountyId];
  if (!b) return;
  const cat = getCategoryById(b.categoryId);
  const isMine = currentUser && b.requester === currentUser.address;
  const isWorker = currentUser && b.worker === currentUser.address;
  const matchingType = b.matchingType || 'firstcome';
  const labels = {
    open: '<span class="badge-open text-xs font-semibold px-2 py-0.5 rounded-full">진행 가능</span>',
    progress: '<span class="badge-progress text-xs font-semibold px-2 py-0.5 rounded-full">진행 중</span>',
    review: '<span class="badge-review text-xs font-semibold px-2 py-0.5 rounded-full">검토 대기</span>',
    done: '<span class="badge-done text-xs font-semibold px-2 py-0.5 rounded-full">완료</span>',
  };
  const deliverableInfo = parseDeliverableType(b.desc);
  const deliverableMeta = getDeliverableTypeMeta(deliverableInfo.type);
  let html = '<div class="space-y-4">';
  html += '<div class="flex items-center justify-between flex-wrap gap-2">';
  html += `<div class="text-xs text-neutral-500 font-medium">${cat.icon} ${cat.name}</div>`;
  html += '<div class="flex items-center gap-1.5">';
  if (b.status === 'open') {
    html += matchingType === 'firstcome'
      ? '<span class="badge-matching-firstcome text-[10px] font-semibold px-2 py-0.5 rounded-full">⚡ 선착순</span>'
      : '<span class="badge-matching-approval text-[10px] font-semibold px-2 py-0.5 rounded-full">🎯 승인 필요</span>';
  }
  html += labels[b.status];
  html += '</div></div>';

  html += `<div><h2 class="font-display text-xl font-bold tracking-tight mb-2">${escapeHtml(b.title)}</h2>`;
  if (b.desc) html += `<p class="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">${escapeHtml(b.desc)}</p>`;
  html += '</div>';
  html += `<div class="bg-white/10 rounded-xl p-3 text-xs text-white/85 border border-white/15"><div class="font-semibold text-white mb-1">결과물 유형: ${escapeHtml(deliverableMeta.label)}</div><div class="leading-relaxed">${escapeHtml(deliverableMeta.hint)}</div></div>`;
  html += '<div class="grid grid-cols-2 gap-3">';
  html += `<div class="bg-neutral-50 rounded-xl p-3" style="border:1.5px solid var(--bx-line,#d9cbb8)"><div class="text-xs text-neutral-500 mb-1">보상</div><div class="font-display text-lg font-bold">${b.reward} XPLA</div></div>`;
  html += `<div class="bg-neutral-50 rounded-xl p-3" style="border:1.5px solid var(--bx-line,#d9cbb8)"><div class="text-xs text-neutral-500 mb-1">마감</div><div class="font-display text-lg font-bold">${b.deadline}</div></div>`;
  html += '</div>';

  if (b.paymentType === 'milestone' && b.milestones && b.milestones.length > 0) {
    const currentIdx = b.currentMilestone || 0;
    html += '<div class="milestone-progress">';
    html += '<div class="flex items-center justify-between mb-3"><span class="text-sm font-semibold text-white">🎯 마일스톤 진행도</span>';
    const doneCount = b.milestones.filter(m => m.status === 'done').length;
    html += `<span class="text-xs text-white/55">${doneCount}/${b.milestones.length} 완료</span></div>`;
    html += '<div class="flex items-center mb-3">';
    b.milestones.forEach((m, i) => {
      let stepCls = 'pending', icon = i + 1;
      if (m.status === 'done') { stepCls = 'done'; icon = '✓'; }
      else if (m.status === 'active' || m.status === 'review') { stepCls = 'active'; }
      html += `<div class="milestone-step ${stepCls}">${icon}</div>`;
      if (i < b.milestones.length - 1) html += `<div class="milestone-line ${m.status === 'done' ? 'done' : ''}"></div>`;
    });
    html += '</div><div class="space-y-1.5">';
    b.milestones.forEach((m, i) => {
      let statusLabel = '';
      if (m.status === 'done') statusLabel = '<span class="text-[10px] text-emerald-300 font-semibold">✓ 완료</span>';
      else if (m.status === 'active') statusLabel = '<span class="text-[10px] text-cyan-300 font-semibold">진행 중</span>';
      else statusLabel = '<span class="text-[10px] text-white/45">대기</span>';
      html += `<div class="flex items-center justify-between gap-2 text-xs"><div class="flex items-center gap-2 flex-1 min-w-0"><span class="text-white/45 flex-shrink-0">${i + 1}.</span><span class="text-white/85 truncate ${i === currentIdx ? 'font-semibold' : ''}">${escapeHtml(m.title)}</span>${statusLabel}</div><span class="text-white/65 font-mono flex-shrink-0">${m.reward} XPLA <span class="text-white/45">(${m.percent}%)</span></span></div>`;
    });
    html += '</div></div>';
  }

  html += '<div class="space-y-2 text-xs">';
  html += `<div class="flex justify-between text-neutral-500"><span>의뢰자</span><span class="font-mono text-neutral-700">${b.requesterShort}${isMine ? ' <span class="my-badge text-[10px] font-semibold px-1.5 py-0.5 rounded ml-1">나</span>' : ''}</span></div>`;
  if (b.workerShort) html += `<div class="flex justify-between text-neutral-500"><span>작업자</span><span class="font-mono text-neutral-700">${b.workerShort}${isWorker ? ' <span class="my-badge text-[10px] font-semibold px-1.5 py-0.5 rounded ml-1">나</span>' : ''}</span></div>`;
  html += `<div class="flex justify-between text-neutral-500"><span>Bounty ID</span><span class="font-mono text-neutral-700">#${b.numId}</span></div>`;
  html += `<div class="flex justify-between text-neutral-500"><span>컨트랙트 상태</span><span class="font-mono text-neutral-700">${b.contractStatus}</span></div>`;
  html += '</div>';

  // 상태별 액션
  if (b.status === 'open' && !isMine && currentUser && b.myApplication) {
    html += '<div class="bg-white/10 rounded-xl p-3 text-xs text-white/85 border border-white/15"><div class="font-semibold text-white mb-1">지원 완료</div><div>이미 이 바운티에 지원했습니다. 의뢰자의 선택을 기다리는 중입니다.</div></div>';
    html += `<button onclick="closeDetailModal(); openMyApplication('${b.id}')" class="w-full px-4 py-2.5 rounded-xl premium-secondary-btn font-semibold text-sm">내 지원 내용 보기</button>`;
  } else if (b.status === 'open' && !isMine && currentUser) {
    const btnLabel = matchingType === 'approval' ? '지원하기 📨' : '신청하기 ✋';
    html += `<button onclick="closeDetailModal(); applyToBounty('${b.id}')" class="w-full px-4 py-2.5 rounded-xl premium-btn text-white font-semibold text-sm">${btnLabel}</button>`;
  } else if (b.status === 'open' && isMine) {
    html += `<button onclick="closeDetailModal(); openApplicantsModal('${b.id}')" class="w-full px-4 py-2.5 rounded-xl premium-btn text-white font-semibold text-sm">지원자 확인하기 →</button>`;
    html += `<button onclick="closeDetailModal(); cancelBounty('${b.id}')" class="w-full mt-2 px-4 py-2.5 rounded-xl premium-secondary-btn font-semibold text-sm">바운티 취소</button>`;
  } else if (b.status === 'progress' && isWorker) {
    if (b.submission) {
      if (b.revisionRequest) {
        html += `<div class="bg-white/10 rounded-xl p-3 text-xs text-white/85 border border-white/15"><div class="font-semibold text-white mb-1">수정 요청 내용</div><div class="leading-relaxed whitespace-pre-wrap">${escapeHtml(b.revisionRequest)}</div></div>`;
      } else {
        html += '<div class="bg-white/10 rounded-xl p-3 text-xs text-white/85 border border-white/15"><div class="font-semibold text-white mb-1">수정 요청 내용 확인 필요</div><div class="leading-relaxed">현재 배포된 컨트랙트 조회 응답에는 수정 요청 사유 필드가 없어 상세 내용을 불러올 수 없습니다. 의뢰자에게 별도 채널로 사유를 확인해야 합니다.</div></div>';
      }
    }
    html += `<button onclick="closeDetailModal(); openWorkSubmit('${b.id}')" class="w-full px-4 py-2.5 rounded-xl premium-btn text-white font-semibold text-sm">결과물 제출하기</button>`;
  } else if (b.status === 'progress' && isMine) {
    html += '<div class="bg-white/10 rounded-xl p-3 text-xs text-white/85 text-center border border-white/15">작업자가 결과물을 제출하기를 기다리는 중...</div>';
  } else if (b.status === 'review' && isMine) {
    html += `<button onclick="closeDetailModal(); openReview('${b.id}')" class="w-full px-4 py-2.5 rounded-xl premium-btn text-white font-semibold text-sm">결과물 검토하기</button>`;
  } else if (b.status === 'review' && isWorker) {
    html += '<div class="bg-violet-50/10 rounded-xl p-3 text-xs text-violet-200 text-center border border-violet-100/30">의뢰자의 검토를 기다리는 중...</div>';
  } else if (b.status === 'done') {
    html += '<div class="bg-white/10 rounded-xl p-3 text-xs text-white/85 border border-white/15"><div class="font-semibold text-white mb-1">✓ 정산 완료</div></div>';
  }

  html += '</div>';
  document.getElementById('detailContent').innerHTML = html;
  document.getElementById('detailModal').classList.remove('hidden');
  document.getElementById('detailModal').classList.add('flex');

  // Load applicants asynchronously for approval mode bounties
  if (b.status === 'open' && isMine && matchingType === 'approval') {
    loadDetailApplicants(bountyId);
  }
}

async function loadDetailApplicants(bountyId) {
  const b = bounties[bountyId];
  if (!b) return;
  try {
    const applicants = await fetchApplicants(b.numId);
    if (applicants.length > 0) {
      b._applicants = applicants;
    }
  } catch (e) { console.error('Failed to load applicants', e); }
}

function cancelBounty(bountyId) {
  const b = bounties[bountyId];
  if (!b) return;
  if (!confirm('바운티를 취소할까요? 예치한 보상이 지갑으로 돌아옵니다.')) return;
  const executeMsg = { cancel_bounty: { bounty_id: b.numId } };
  executeContract(executeMsg, '0', '취소 완료! 보상이 반환되었어요.').catch(() => {});
}
function closeDetailModal() { document.getElementById('detailModal').classList.add('hidden'); document.getElementById('detailModal').classList.remove('flex'); }

function normalizeProofUrl(value) {
  const url = (value || '').trim();
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (!['https:', 'http:', 'ipfs:', 'ipns:', 'ar:'].includes(parsed.protocol)) return '';
    return parsed.href;
  } catch (e) {
    return '';
  }
}

async function makeProofHash(summary, proofUrl, bountyId, milestoneIndex, visibility, privateRef) {
  const payload = JSON.stringify({ bountyId, milestoneIndex, proofUrl, summary, visibility, privateRef });
  const bytes = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return '0x' + Array.from(new Uint8Array(digest)).map(x => x.toString(16).padStart(2, '0')).join('');
}

function buildSubmissionSummary(summary, proofUrl, visibility = 'public') {
  if (visibility === 'private') {
    return `Proof Mode: private\nProof URL: private\n\nSummary:\n${summary}`;
  }
  return `Proof Mode: public\nProof URL: ${proofUrl}\n\nSummary:\n${summary}`;
}

function parseSubmissionSummary(summary) {
  const text = summary || '';
  const nextMatch = text.match(/^Proof Mode:\s*(public|private)\nProof URL:\s*(.*?)\n\nSummary:\n([\s\S]*)$/);
  if (nextMatch) {
    const visibility = nextMatch[1].trim();
    return {
      visibility,
      proofUrl: visibility === 'private' ? '' : nextMatch[2].trim(),
      body: nextMatch[3].trim(),
    };
  }
  const legacyMatch = text.match(/^Proof URL:\s*(.+?)\n\nSummary:\n([\s\S]*)$/);
  if (!legacyMatch) return { visibility: 'legacy', proofUrl: '', body: text };
  return { visibility: 'public', proofUrl: legacyMatch[1].trim(), body: legacyMatch[2].trim() };
}

function updateProofVisibility() {
  const visibility = document.querySelector('input[name="proofVisibility"]:checked')?.value || 'public';
  const publicSection = document.getElementById('publicProofSection');
  const privateSection = document.getElementById('privateProofSection');
  const proofUrlInput = document.getElementById('proofUrlInput');
  document.querySelectorAll('#proofVisibilityGroup .proof-visibility-option').forEach(option => {
    const checked = option.closest('label')?.querySelector('input')?.checked;
    option.classList.toggle('border-violet-300', !!checked);
    option.classList.toggle('bg-violet-50', !!checked);
  });
  if (publicSection) publicSection.classList.toggle('hidden', visibility !== 'public');
  if (privateSection) privateSection.classList.toggle('hidden', visibility !== 'private');
  if (proofUrlInput) proofUrlInput.required = visibility === 'public';
}

function openWorkSubmit(bountyId) {
  const b = bounties[bountyId];
  if (!b) return;
  
  // 마일스톤 모드면 현재 활성 마일스톤 정보 표시
  const isMilestone = b.paymentType === 'milestone' && b.milestones;
  const currentMs = isMilestone ? b.milestones[b.currentMilestone || 0] : null;
  const submitReward = currentMs ? currentMs.reward : b.reward;
  
  let html = '<div class="space-y-4">';
  html += `<div class="bg-violet-50/10 rounded-xl p-3.5 border border-violet-100/30 text-sm"><div class="font-semibold text-white mb-1">📋 ${escapeHtml(b.title)}</div><div class="text-xs text-white/65">${escapeHtml(b.desc || '설명 없음')}</div></div>`;
  
  if (isMilestone && currentMs) {
    html += `<div class="bg-emerald-50/10 rounded-xl p-3 border border-emerald-100/30">`;
    html += `<div class="text-xs text-white font-semibold mb-1">🎯 현재 마일스톤 (${(b.currentMilestone || 0) + 1}/${b.milestones.length})</div>`;
    html += `<div class="text-sm text-white font-semibold">${escapeHtml(currentMs.title)}</div>`;
    html += `<div class="text-xs text-white/65 mt-1">이 마일스톤 정산: ${currentMs.reward} XPLA (${currentMs.percent}%)</div>`;
    html += `</div>`;
  }
  
  html += '<div><label class="block text-sm font-medium text-neutral-700 mb-1.5">결과물 링크</label><input id="proofUrlInput" type="url" class="input-field w-full px-3.5 py-2.5 rounded-xl text-sm" placeholder="https://drive.google.com/... 또는 https://github.com/..." /></div>';
  html += '<div><label class="block text-sm font-medium text-neutral-700 mb-1.5">결과물 요약</label><textarea id="submissionInput" class="input-field w-full px-3.5 py-2.5 rounded-xl text-sm resize-none" rows="5" placeholder="작업한 결과와 확인 방법을 정리해주세요..."></textarea></div>';
  html += '<div class="bg-violet-50/10 rounded-xl p-3 text-xs text-violet-200 border border-violet-100/30"><div class="font-semibold mb-1">🔒 증빙 지문 생성</div><div class="opacity-80 leading-relaxed">제출 시 결과물 링크와 요약으로 고유 해시를 만들어 컨트랙트에 함께 기록합니다.</div></div>';
  html += `<div class="bg-white/10 rounded-xl p-3 text-xs text-white/85 border border-white/15"><div class="font-semibold text-white mb-1">💰 예상 보상</div><div>승인 시 <strong>${(submitReward * 0.9).toFixed(1)} XPLA</strong>가 정산됩니다 (90%)</div></div>`;
  html += '<div class="flex gap-2">';
  html += '<button onclick="closeWorkModal()" class="flex-1 px-4 py-2.5 rounded-xl premium-secondary-btn font-semibold text-sm">취소</button>';
  html += `<button onclick="submitWork('${b.id}')" class="flex-1 px-4 py-2.5 rounded-xl premium-btn text-white font-semibold text-sm">결과물 제출하기</button>`;
  html += '</div></div>';
  document.getElementById('workContent').innerHTML = html;
  document.getElementById('workModal').classList.remove('hidden');
  document.getElementById('workModal').classList.add('flex');
}
function closeWorkModal() { document.getElementById('workModal').classList.add('hidden'); document.getElementById('workModal').classList.remove('flex'); }
async function submitWork(bountyId) {
  const summary = document.getElementById('submissionInput').value.trim();
  if (!summary) { showToast('결과물 요약을 작성해주세요'); return; }
  const b = bounties[bountyId];
  if (!b) return;
  const proofUrl = normalizeProofUrl(document.getElementById('proofUrlInput')?.value);
  if (!proofUrl) { showToast('결과물 링크를 올바른 URL로 입력해주세요'); return; }
  const milestoneIndex = b.paymentType === 'milestone' ? b.currentMilestone : null;
  const proofHash = await makeProofHash(summary, proofUrl, b.numId, milestoneIndex);
  const executeMsg = {
    submit_work: {
      bounty_id: b.numId,
      proof_hash: proofHash,
      summary: buildSubmissionSummary(summary, proofUrl),
      milestone_index: milestoneIndex,
    }
  };
  closeWorkModal();
  executeContract(executeMsg, '0', '결과 제출 완료!').catch(() => {});
}

function openReview(bountyId) {
  const b = bounties[bountyId];
  if (!b || !b.submission) return;
  
  const isMilestone = b.paymentType === 'milestone' && b.milestones;
  const currentMs = isMilestone ? b.milestones[b.currentMilestone || 0] : null;
  const reviewReward = currentMs ? currentMs.reward : b.reward;
  const deliverableInfo = parseDeliverableType(b.desc);
  const deliverableMeta = getDeliverableTypeMeta(deliverableInfo.type);
  
  let html = '<div class="space-y-4">';
  
  if (isMilestone && currentMs) {
    html += `<div class="bg-emerald-50/10 rounded-xl p-3 border border-emerald-100/30">`;
    html += `<div class="text-xs text-white font-semibold mb-1">🎯 검토 중: 마일스톤 ${(b.currentMilestone || 0) + 1}/${b.milestones.length}</div>`;
    html += `<div class="text-sm text-white font-semibold">${escapeHtml(currentMs.title)}</div>`;
    html += `<div class="text-xs text-white/65 mt-1">이번 정산: ${reviewReward} XPLA · 승인 후 다음 마일스톤 활성화</div>`;
    html += `</div>`;
  }

  const parsedSubmission = parseSubmissionSummary(b.submission.summary);
  const safeProofUrl = normalizeProofUrl(parsedSubmission.proofUrl);
  html += `<div class="bg-white/10 rounded-xl p-3 text-xs text-white/85 border border-white/15"><div class="font-semibold text-white mb-1">결과물 유형: ${escapeHtml(deliverableMeta.label)}</div><div class="leading-relaxed">${escapeHtml(deliverableMeta.submit)}</div></div>`;
  
  html += '<div class="bg-violet-50/10 rounded-xl p-3.5 border border-violet-100/30">';
  html += '<div class="flex items-center gap-2 mb-2"><svg class="w-4 h-4 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/></svg><span class="text-xs font-semibold text-violet-200">Proof Bundle</span></div>';
  html += `<div class="font-mono text-xs text-violet-200/80 break-all">${b.submission.proofBundle}</div></div>`;
  if (safeProofUrl) {
    html += `<div><div class="text-sm font-medium text-neutral-700 mb-2">결과물 링크</div><a href="${escapeHtml(safeProofUrl)}" target="_blank" rel="noopener noreferrer" class="block bg-neutral-50 rounded-xl p-3.5 text-sm text-violet-200 underline break-all">${escapeHtml(safeProofUrl)}</a></div>`;
  } else if (parsedSubmission.proofUrl) {
    html += '<div class="bg-white/10 rounded-xl p-3 text-xs text-white/85 border border-white/15"><div class="font-semibold text-white mb-1">링크 확인 필요</div><div class="leading-relaxed">제출 기록에 올바르지 않은 링크가 포함되어 표시하지 않았습니다. 작업자에게 다시 제출을 요청하세요.</div></div>';
  }
  html += `<div><div class="text-sm font-medium text-neutral-700 mb-2">결과물 요약</div><div class="bg-neutral-50 rounded-xl p-3.5 text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">${escapeHtml(parsedSubmission.body)}</div></div>`;
  html += `<div><div class="text-sm font-medium text-neutral-700 mb-2">작업자 정보</div><div class="bg-neutral-50 rounded-xl p-3 text-xs"><div class="flex justify-between text-neutral-500"><span>주소</span><span class="font-mono text-neutral-700">${b.workerShort}</span></div></div></div>`;
  html += '<div class="bg-white/10 rounded-xl p-3 text-xs text-white/85 border border-white/15"><div class="font-semibold text-white mb-1">⏰ 14일 안에 응답하지 않으면</div><div>컨트랙트가 자동으로 작업자에게 정산합니다</div></div>';
  html += '<div class="flex gap-2">';
  html += `<button onclick="openRejectReason('${b.id}')" class="flex-1 px-4 py-2.5 rounded-xl premium-secondary-btn font-semibold text-sm">수정 요청</button>`;

  const approveLabel = '승인하고 정산하기';
  html += `<button onclick="approveWork('${b.id}')" class="flex-1 px-4 py-2.5 rounded-xl premium-btn text-white font-semibold text-sm">${approveLabel}</button>`;
  html += '</div></div>';
  document.getElementById('reviewContent').innerHTML = html;
  document.getElementById('reviewModal').classList.remove('hidden');
  document.getElementById('reviewModal').classList.add('flex');
}
function closeReviewModal() { document.getElementById('reviewModal').classList.add('hidden'); document.getElementById('reviewModal').classList.remove('flex'); }

function approveWorkWithChecklist(bountyId) {
  const checks = Array.from(document.querySelectorAll('#approvalChecklist input[type="checkbox"]'));
  if (checks.length > 0 && checks.some(check => !check.checked)) {
    showToast('승인 전 체크리스트를 모두 확인해주세요');
    return;
  }
  approveWork(bountyId);
}

function approveWork(bountyId) {
  const b = bounties[bountyId];
  if (!b) return;
  const executeMsg = { approve_work: { bounty_id: b.numId } };
  closeReviewModal();
  executeContract(executeMsg, '0', '정산 완료!').then(() => {
    const isMilestone = b.paymentType === 'milestone' && b.milestones && b.milestones.length > 0;
    if (isMilestone) {
      const currentIdx = b.currentMilestone || 0;
      const currentMs = b.milestones[currentIdx];
      const isFinal = currentIdx >= b.milestones.length - 1;
      if (currentMs) openMilestoneSettlement(b, currentMs, isFinal);
      else openSettlement(b);
    } else {
      openSettlement(b);
    }
  }).catch(() => {});
}
function openRejectReason(bountyId) {
  const b = bounties[bountyId];
  if (!b) return;
  let html = '<div class="space-y-4">';
  html += `<div class="bg-white/10 rounded-xl p-3.5 border border-white/15"><div class="text-xs text-white font-semibold mb-1">수정 요청</div><div class="text-sm text-white font-semibold">${escapeHtml(b.title)}</div><div class="text-xs text-white/70 mt-1">작업자가 무엇을 고쳐야 하는지 구체적으로 남겨주세요.</div></div>`;
  html += '<div class="bg-white/10 rounded-xl p-3 text-xs text-white/85 border border-white/15"><div class="font-semibold text-white mb-1">현재 컨트랙트 한계</div><div class="leading-relaxed">현재 배포된 컨트랙트 조회 응답에는 수정 요청 사유를 다시 보여주는 필드가 없습니다. 트랜잭션은 실행되지만 작업자가 이 내용을 앱에서 바로 보지 못할 수 있어, 별도 채널로도 전달하는 것을 권장합니다.</div></div>';
  html += '<div><label class="block text-sm font-medium text-neutral-700 mb-1.5">수정 요청 내용</label><textarea id="rejectReasonInput" class="input-field w-full px-3.5 py-2.5 rounded-xl text-sm resize-none" rows="5" placeholder="예: 결과물 링크 접근 권한이 없습니다. 2번 요구사항에 대한 근거 자료를 추가해주세요."></textarea></div>';
  html += '<div class="bg-neutral-50 rounded-xl p-3 text-xs text-neutral-500 leading-relaxed">수정 요청도 트랜잭션으로 기록됩니다. 개인정보나 비공개 자료 원문은 적지 말고, 필요한 수정 방향만 남기는 것을 권장합니다.</div>';
  html += '<div class="flex gap-2">';
  html += `<button onclick="openReview('${b.id}')" class="flex-1 px-4 py-2.5 rounded-xl premium-secondary-btn font-semibold text-sm">돌아가기</button>`;
  html += `<button onclick="submitRejectWork('${b.id}')" class="flex-1 px-4 py-2.5 rounded-xl premium-btn text-white font-semibold text-sm">수정 요청 보내기</button>`;
  html += '</div></div>';
  document.getElementById('reviewContent').innerHTML = html;
}

function submitRejectWork(bountyId) {
  const reason = document.getElementById('rejectReasonInput')?.value.trim();
  if (!reason) { showToast('수정 요청 내용을 입력해주세요'); return; }
  if (reason.length < 10) { showToast('수정 요청 내용을 조금 더 구체적으로 적어주세요'); return; }
  const b = bounties[bountyId];
  if (!b) return;
  const executeMsg = { reject_work: { bounty_id: b.numId, reason } };
  closeReviewModal();
  executeContract(executeMsg, '0', '수정 요청 완료!').catch(() => {});
}

// 마일스톤 정산 모달
function openMilestoneSettlement(b, milestone, isFinal) {
  const total = milestone.reward;
  let html = '<div class="space-y-3">';
  html += `<div class="text-center mb-4">`;
  html += `<div class="text-xs text-neutral-500 mb-1">${isFinal ? '🎉 최종 마일스톤 정산' : '✓ 마일스톤 정산'}</div>`;
  html += `<div class="font-display text-3xl font-bold tracking-tight text-white">${total} <span class="text-base font-medium text-white/55">XPLA</span></div>`;
  html += `<div class="text-xs text-white/65 mt-1">${escapeHtml(milestone.title)} (${milestone.percent}%)</div>`;
  html += `</div>`;
  html += '<div class="space-y-2">';
  html += `<div class="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100"><div><div class="text-sm font-medium text-emerald-900">작업자 보상</div><div class="text-xs text-emerald-700">${b.workerShort} · 90%</div></div><div class="font-display font-bold text-emerald-900">${(total * 0.9).toFixed(1)}</div></div>`;
  html += `<div class="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100"><div><div class="text-sm font-medium text-neutral-700">Validator</div><div class="text-xs text-neutral-500">검증자 · 3%</div></div><div class="font-display font-bold text-neutral-700">${(total * 0.03).toFixed(1)}</div></div>`;
  html += `<div class="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100"><div><div class="text-sm font-medium text-neutral-700">Burn</div><div class="text-xs text-neutral-500">토큰 소각 · 3%</div></div><div class="font-display font-bold text-neutral-700">${(total * 0.03).toFixed(1)}</div></div>`;
  html += `<div class="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100"><div><div class="text-sm font-medium text-neutral-700">Ecosystem · Team</div><div class="text-xs text-neutral-500">생태계 · 4%</div></div><div class="font-display font-bold text-neutral-700">${(total * 0.04).toFixed(1)}</div></div>`;
  html += '</div>';
  
  if (!isFinal) {
    const nextIdx = (b.currentMilestone || 0) + 1;
    const nextMs = b.milestones[nextIdx];
    if (nextMs) {
      html += `<div class="mt-4 px-3 py-2.5 rounded-xl bg-violet-50/10 border border-violet-100/30 flex items-start gap-2">`;
      html += `<span class="text-base">🎯</span>`;
      html += `<div class="text-xs text-violet-200"><div class="font-semibold mb-0.5">다음 마일스톤 활성화</div><div class="opacity-80">${escapeHtml(nextMs.title)} (${nextMs.reward} XPLA)</div></div>`;
      html += `</div>`;
    }
  } else {
    html += '<div class="mt-4 px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 flex items-start gap-2"><svg class="w-4 h-4 mt-0.5 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"/></svg><div class="text-xs text-white/85"><div class="font-semibold text-white mb-0.5">프로젝트 완료!</div><div>모든 마일스톤이 정산되었습니다</div></div></div>';
  }
  
  html += '</div>';
  document.getElementById('settlementContent').innerHTML = html;
  document.getElementById('settlementModal').classList.remove('hidden');
  document.getElementById('settlementModal').classList.add('flex');
}

function openSettlement(b) {
  const total = b.reward;
  let html = '<div class="space-y-3">';
  html += `<div class="text-center mb-4"><div class="text-xs text-neutral-500 mb-1">총 정산액</div><div class="font-display text-3xl font-bold tracking-tight">${total} <span class="text-base font-medium text-neutral-500">XPLA</span></div></div>`;
  html += '<div class="space-y-2">';
  html += `<div class="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100"><div><div class="text-sm font-medium text-emerald-900">작업자 보상</div><div class="text-xs text-emerald-700">${b.workerShort} · 90%</div></div><div class="font-display font-bold text-emerald-900">${(total * 0.9).toFixed(1)}</div></div>`;
  html += `<div class="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100"><div><div class="text-sm font-medium text-neutral-700">Validator</div><div class="text-xs text-neutral-500">검증자 · 3%</div></div><div class="font-display font-bold text-neutral-700">${(total * 0.03).toFixed(1)}</div></div>`;
  html += `<div class="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100"><div><div class="text-sm font-medium text-neutral-700">Burn</div><div class="text-xs text-neutral-500">토큰 소각 · 3%</div></div><div class="font-display font-bold text-neutral-700">${(total * 0.03).toFixed(1)}</div></div>`;
  html += `<div class="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100"><div><div class="text-sm font-medium text-neutral-700">Ecosystem · Team</div><div class="text-xs text-neutral-500">생태계 · 4%</div></div><div class="font-display font-bold text-neutral-700">${(total * 0.04).toFixed(1)}</div></div>`;
  html += '</div>';
  html += '<div class="mt-4 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-2"><svg class="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"/></svg><div class="text-xs text-emerald-800"><div class="font-semibold mb-0.5">컨트랙트가 자동 분배</div><div>의뢰자 승인과 동시에 코드로 정산되었습니다</div></div></div>';
  html += '</div>';
  document.getElementById('settlementContent').innerHTML = html;
  document.getElementById('settlementModal').classList.remove('hidden');
  document.getElementById('settlementModal').classList.add('flex');
}
function closeSettlementModal() { document.getElementById('settlementModal').classList.add('hidden'); document.getElementById('settlementModal').classList.remove('flex'); }

// reward collection handled by contract automatically

const originalOpenDetailForAbandon = openDetail;
openDetail = async function(bountyId) {
  await originalOpenDetailForAbandon(bountyId);
  const b = bounties[bountyId];
  const isWorker = currentUser && b && b.worker === currentUser.address;
  if (!b || b.status !== 'progress' || !isWorker) return;
  const content = document.getElementById('detailContent');
  const submitButton = content?.querySelector('button[onclick*="openWorkSubmit"]');
  if (!content || !submitButton || document.getElementById('abandonInfoBtn')) return;
  submitButton.insertAdjacentHTML('afterend', `<button id="abandonInfoBtn" onclick="openAbandonInfo('${b.id}')" class="w-full mt-2 px-4 py-2.5 rounded-xl premium-secondary-btn font-semibold text-sm">작업 포기 안내</button>`);
};

function openAbandonInfo(bountyId) {
  const b = bounties[bountyId];
  if (!b) return;
  let html = '<div class="space-y-4">';
  html += `<div class="bg-white/10 rounded-xl p-3.5 border border-white/15"><div class="text-xs text-white font-semibold mb-1">작업 포기 안내</div><div class="text-sm text-white font-semibold">${escapeHtml(b.title)}</div><div class="text-xs text-white/70 mt-1">포기 기록은 의뢰자에게 표시되고, 이후 평가 시스템에 반영되는 흐름으로 설계하는 것이 좋습니다.</div></div>`;
  html += '<div class="bg-neutral-50 rounded-xl p-3 text-xs text-neutral-600 leading-relaxed">현재 연결된 컨트랙트에는 작업자가 직접 포기하는 트랜잭션이 아직 보이지 않습니다. 지금은 의뢰자에게 연락해 재배정/취소를 처리해야 하고, 다음 단계에서 abandon_work 같은 명령과 평가 기록을 컨트랙트에 추가해야 합니다.</div>';
  html += '<div class="bg-white/10 rounded-xl p-3 text-xs text-white/85 border border-white/15"><div class="font-semibold text-white mb-1">권장 규칙</div><div class="leading-relaxed">결과물 제출 전에는 포기 가능, 제출 후에는 단순 포기보다 수정 요청/분쟁 절차로 이동하는 편이 안전합니다.</div></div>';
  html += '<button onclick="openDetail(\'' + b.id + '\')" class="w-full px-4 py-2.5 rounded-xl premium-btn text-white font-semibold text-sm">확인</button>';
  html += '</div>';
  document.getElementById('detailContent').innerHTML = html;
}

const originalOpenReviewForPolicyHints = openReview;
openReview = function(bountyId) {
  originalOpenReviewForPolicyHints(bountyId);
  const b = bounties[bountyId];
  if (!b || !b.submission) return;
  const content = document.getElementById('reviewContent');
  if (!content) return;
  const parsed = parseSubmissionSummary(b.submission.summary);
  const buttonRow = Array.from(content.querySelectorAll('.flex.gap-2')).pop();
  if (parsed.visibility === 'private' && !document.getElementById('privateSubmissionNotice')) {
    content.insertAdjacentHTML('afterbegin', '<div id="privateSubmissionNotice" class="mb-4 bg-white/10 rounded-xl p-3 text-xs text-white/85 border border-white/15"><div class="font-semibold text-white mb-1">비공개 제출</div><div class="leading-relaxed">결과물 링크는 공개 기록에 남기지 않았습니다. 의뢰자와 합의한 별도 채널에서 받은 자료를 확인한 뒤 승인하세요.</div></div>');
  }
  if (buttonRow && !document.getElementById('revisionPolicyNotice')) {
    buttonRow.insertAdjacentHTML('beforebegin', `<div id="approvalChecklist" class="bg-neutral-50 rounded-xl p-3 text-xs text-neutral-600 border border-neutral-200"><div class="font-semibold text-neutral-800 mb-2">승인 전 체크리스트</div><label class="flex items-start gap-2 mb-1.5"><input type="checkbox" class="mt-0.5" /><span>등록된 작업 범위와 결과물이 일치합니다.</span></label><label class="flex items-start gap-2 mb-1.5"><input type="checkbox" class="mt-0.5" /><span>${parsed.visibility === 'private' ? '별도 채널로 받은 비공개 결과물을 확인했습니다.' : '결과물 링크에 접근할 수 있고 내용을 확인했습니다.'}</span></label><label class="flex items-start gap-2"><input type="checkbox" class="mt-0.5" /><span>승인하면 해당 마일스톤 보상이 정산되는 것을 이해했습니다.</span></label></div>`);
    buttonRow.insertAdjacentHTML('beforebegin', `<div id="revisionPolicyNotice" class="bg-white/10 rounded-xl p-3 text-xs text-white/85 border border-white/15 leading-relaxed">수정 요청은 마일스톤당 최대 ${MAX_REVISION_REQUESTS}회를 권장합니다. 계속 반려되거나 의뢰자가 반복해서 거절하는 경우에는 분쟁/평가 절차로 넘기는 구조가 필요합니다.</div>`);
    const approveButton = buttonRow.querySelector('button[onclick*="approveWork"]');
    if (approveButton) approveButton.setAttribute('onclick', `approveWorkWithChecklist('${b.id}')`);
  }
};

const originalOpenRejectReasonForPolicyHints = openRejectReason;
openRejectReason = function(bountyId) {
  originalOpenRejectReasonForPolicyHints(bountyId);
  const content = document.getElementById('reviewContent');
  const buttonRow = Array.from(content?.querySelectorAll('.flex.gap-2') || []).pop();
  if (buttonRow && !document.getElementById('rejectLimitNotice')) {
    buttonRow.insertAdjacentHTML('beforebegin', '<div id="rejectTemplateTools" class="bg-neutral-50 rounded-xl p-3 text-xs text-neutral-600 border border-neutral-200"><div class="font-semibold text-neutral-800 mb-2">수정요청 템플릿</div><div class="grid grid-cols-1 gap-1.5"><button type="button" onclick="fillRejectTemplate(\'결과물 링크 접근 권한이 없어 확인할 수 없습니다. 접근 권한을 열어주시거나 확인 가능한 링크를 다시 제출해주세요.\')" class="px-3 py-2 rounded-lg bg-white border border-neutral-200 text-left">링크 접근 권한 문제</button><button type="button" onclick="fillRejectTemplate(\'등록된 검수 기준 중 일부가 충족되지 않았습니다. 누락된 항목을 보완하고, 변경 요약을 함께 남겨주세요.\')" class="px-3 py-2 rounded-lg bg-white border border-neutral-200 text-left">검수 기준 미충족</button><button type="button" onclick="fillRejectTemplate(\'결과물 요약만으로는 확인이 어렵습니다. 어떤 파일/문서에서 무엇을 확인해야 하는지 구체적인 위치를 추가해주세요.\')" class="px-3 py-2 rounded-lg bg-white border border-neutral-200 text-left">확인 방법 부족</button></div></div>');
    buttonRow.insertAdjacentHTML('beforebegin', `<div id="rejectLimitNotice" class="bg-white/10 rounded-xl p-3 text-xs text-white/85 border border-white/15"><div class="font-semibold text-white mb-1">수정 요청 원칙</div><div class="leading-relaxed">마일스톤당 수정 요청은 최대 ${MAX_REVISION_REQUESTS}회를 권장합니다. 이후에도 해결되지 않으면 반복 반려 대신 분쟁/평가 절차로 넘겨야 합니다.</div></div>`);
  }
};

function fillRejectTemplate(text) {
  const input = document.getElementById('rejectReasonInput');
  if (!input) return;
  input.value = text;
  input.focus();
}

openWorkSubmit = function(bountyId) {
  const b = bounties[bountyId];
  if (!b) return;
  const isMilestone = b.paymentType === 'milestone' && b.milestones;
  const currentMs = isMilestone ? b.milestones[b.currentMilestone || 0] : null;
  const submitReward = currentMs ? currentMs.reward : b.reward;
  const deliverableInfo = parseDeliverableType(b.desc);
  const deliverableMeta = getDeliverableTypeMeta(deliverableInfo.type);
  const defaultPrivate = deliverableInfo.type === 'private_delivery';

  let html = '<div class="space-y-4">';
  html += `<div class="bg-violet-50/10 rounded-xl p-3.5 border border-violet-100/30 text-sm"><div class="font-semibold text-white mb-1">${escapeHtml(b.title)}</div><div class="text-xs text-white/65">${escapeHtml(b.desc || '설명 없음')}</div></div>`;

  if (isMilestone && currentMs) {
    html += '<div class="bg-emerald-50/10 rounded-xl p-3 border border-emerald-100/30">';
    html += `<div class="text-xs text-white font-semibold mb-1">현재 마일스톤 (${(b.currentMilestone || 0) + 1}/${b.milestones.length})</div>`;
    html += `<div class="text-sm text-white font-semibold">${escapeHtml(currentMs.title)}</div>`;
    html += `<div class="text-xs text-white/65 mt-1">이 마일스톤 정산: ${currentMs.reward} XPLA (${currentMs.percent}%)</div>`;
    html += '</div>';
  }

  html += `<div class="bg-white/10 rounded-xl p-3 text-xs text-white/85 border border-white/15"><div class="font-semibold text-white mb-1">결과물 유형: ${escapeHtml(deliverableMeta.label)}</div><div class="leading-relaxed">${escapeHtml(deliverableMeta.submit)}</div></div>`;
  html += '<div id="proofVisibilityGroup"><label class="block text-sm font-medium text-neutral-700 mb-2">결과물 공개 방식</label><div class="grid grid-cols-2 gap-2">';
  html += `<label class="cursor-pointer"><input type="radio" name="proofVisibility" value="public" ${defaultPrivate ? '' : 'checked'} class="sr-only" onchange="updateProofVisibility()" /><div class="proof-visibility-option rounded-xl p-3 border border-neutral-200 bg-neutral-50"><div class="text-sm font-semibold text-neutral-800">공개 링크</div><div class="text-[11px] text-neutral-500 mt-1 leading-relaxed">링크가 제출 기록에 남습니다.</div></div></label>`;
  html += `<label class="cursor-pointer"><input type="radio" name="proofVisibility" value="private" ${defaultPrivate ? 'checked' : ''} class="sr-only" onchange="updateProofVisibility()" /><div class="proof-visibility-option rounded-xl p-3 border border-neutral-200 bg-neutral-50"><div class="text-sm font-semibold text-neutral-800">비공개 제출</div><div class="text-[11px] text-neutral-500 mt-1 leading-relaxed">링크를 공개 기록에 남기지 않습니다.</div></div></label>`;
  html += '</div></div>';
  html += '<div id="publicProofSection"><label class="block text-sm font-medium text-neutral-700 mb-1.5">결과물 링크</label><input id="proofUrlInput" type="url" class="input-field w-full px-3.5 py-2.5 rounded-xl text-sm" placeholder="https://drive.google.com/... 또는 https://github.com/..." /></div>';
  html += '<div id="privateProofSection" class="hidden bg-white/10 rounded-xl p-3 text-xs text-white/85 border border-white/15"><div class="font-semibold text-white mb-1">비공개 결과물 안내</div><div class="leading-relaxed">번역 원문, 문서 링크, 파일 링크처럼 민감한 자료는 온체인 제출 내용에 적지 마세요. 의뢰자와 합의한 외부 채널로 전달하고, 여기에는 검토 가능한 요약만 남깁니다.</div><input id="privateProofRefInput" class="input-field w-full px-3 py-2 rounded-lg text-xs mt-2" placeholder="선택: 의뢰자에게 전달한 파일명/버전/채널 메모" /></div>';
  html += '<div class="bg-neutral-50 rounded-xl p-3 text-xs text-neutral-600 border border-neutral-200"><div class="font-semibold text-neutral-800 mb-1">제출 전 확인</div><div class="leading-relaxed">요약에는 완료한 범위, 확인 방법, 남은 이슈를 적어주세요. 공개 링크 제출 시 접근 권한을 열어두고, 비공개 제출 시 실제 링크는 공개 기록에 남기지 마세요.</div></div>';
  html += '<div><label class="block text-sm font-medium text-neutral-700 mb-1.5">결과물 요약</label><textarea id="submissionInput" class="input-field w-full px-3.5 py-2.5 rounded-xl text-sm resize-none" rows="5" placeholder="작업 결과와 확인 방법을 정리해주세요..."></textarea></div>';
  html += '<div class="bg-white/10 rounded-xl p-3 text-xs text-white/85 border border-white/15"><div class="font-semibold text-white mb-1">증빙 지문 생성</div><div class="leading-relaxed">제출 내용으로 고유 해시를 만들고 컨트랙트에는 그 해시와 요약만 기록합니다. 비공개 제출은 실제 링크를 기록하지 않습니다.</div></div>';
  html += `<div class="bg-white/10 rounded-xl p-3 text-xs text-white/85 border border-white/15"><div class="font-semibold text-white mb-1">예상 보상</div><div>승인 시 <strong>${(submitReward * 0.9).toFixed(1)} XPLA</strong>가 정산됩니다. (90%)</div></div>`;
  html += '<div class="flex gap-2">';
  html += '<button onclick="closeWorkModal()" class="flex-1 px-4 py-2.5 rounded-xl premium-secondary-btn font-semibold text-sm">취소</button>';
  html += `<button onclick="submitWork('${b.id}')" class="flex-1 px-4 py-2.5 rounded-xl premium-btn text-white font-semibold text-sm">결과물 제출하기</button>`;
  html += '</div></div>';
  document.getElementById('workContent').innerHTML = html;
  document.getElementById('workModal').classList.remove('hidden');
  document.getElementById('workModal').classList.add('flex');
  updateProofVisibility();
};

submitWork = async function(bountyId) {
  const summary = document.getElementById('submissionInput').value.trim();
  if (!summary) { showToast('결과물 요약을 작성해주세요'); return; }
  const b = bounties[bountyId];
  if (!b) return;
  const visibility = document.querySelector('input[name="proofVisibility"]:checked')?.value || 'public';
  const privateRef = document.getElementById('privateProofRefInput')?.value.trim() || '';
  let proofUrl = '';
  if (visibility === 'public') {
    proofUrl = normalizeProofUrl(document.getElementById('proofUrlInput')?.value);
    if (!proofUrl) { showToast('결과물 링크를 올바른 URL로 입력해주세요'); return; }
  }
  const milestoneIndex = b.paymentType === 'milestone' ? b.currentMilestone : null;
  const proofHash = await makeProofHash(summary, proofUrl, b.numId, milestoneIndex, visibility, privateRef);
  const executeMsg = {
    submit_work: {
      bounty_id: b.numId,
      proof_hash: proofHash,
      summary: buildSubmissionSummary(summary, proofUrl, visibility),
      milestone_index: milestoneIndex,
    }
  };
  closeWorkModal();
  executeContract(executeMsg, '0', '결과 제출 완료!').catch(() => {});
};

function openProofDevPreview() {
  const now = Date.now();
  bounties['dev-proof-preview'] = {
    id: 'dev-proof-preview',
    numId: 999,
    title: '로컬 테스트: 결과물 증빙 확인',
    desc: 'GitHub에 올리기 전 결과물 링크 입력과 proof hash 생성을 확인하는 임시 바운티입니다.',
    reward: 10,
    paymentType: 'milestone',
    milestones: [
      { id: 'm_0', title: '초안 제출', percent: 40, reward: 4, status: 'active' },
      { id: 'm_1', title: '최종본 제출', percent: 60, reward: 6, status: 'pending' },
    ],
    currentMilestone: 0,
    createdAt: now,
    status: 'progress',
    requester: 'xpla1devrequester000000000000000000000000000',
    requesterShort: 'xpla1dev...0000',
    worker: currentUser?.address || 'xpla1devworker00000000000000000000000000000',
    workerShort: currentUser?.shortAddress || 'xpla1dev...0000',
  };
  openWorkSubmit('dev-proof-preview');
}

function openReviewDevPreview() {
  const now = Date.now();
  bounties['dev-review-preview'] = {
    id: 'dev-review-preview',
    numId: 1000,
    title: '로컬 테스트: 마일스톤 승인 확인',
    desc: '승인 후 현재 마일스톤만 정산되는 화면을 확인하는 임시 바운티입니다.',
    reward: 10,
    paymentType: 'milestone',
    milestones: [
      { id: 'm_0', title: '초안 제출', percent: 40, reward: 4, status: 'active' },
      { id: 'm_1', title: '최종본 제출', percent: 60, reward: 6, status: 'pending' },
    ],
    currentMilestone: 0,
    createdAt: now,
    status: 'review',
    requester: currentUser?.address || 'xpla1devrequester000000000000000000000000000',
    requesterShort: currentUser?.shortAddress || 'xpla1dev...0000',
    worker: 'xpla1devworker00000000000000000000000000000',
    workerShort: 'xpla1dev...0000',
    submission: {
      proofBundle: '0x' + 'a'.repeat(64),
      summary: buildSubmissionSummary('초안 화면과 핵심 플로우를 정리했습니다. 링크에서 결과물을 확인해주세요.', 'https://github.com/bctfsh-usagi/bounxapp'),
      submittedAt: now,
    },
  };
  openReview('dev-review-preview');
}

const DEV_SCENARIO_ID = 'dev-scenario-bounty';
let devScenarioRole = 'requester';
let devScenarioStage = 'open-approval';

function getDevScenarioUsers() {
  return {
    requester: {
      address: 'xpla1devrequester000000000000000000000000000',
      shortAddress: 'xpla1dev...req',
      balance: '100',
      connectType: 'DEV',
    },
    worker: {
      address: 'xpla1devworker00000000000000000000000000000',
      shortAddress: 'xpla1dev...wrk',
      balance: '100',
      connectType: 'DEV',
    },
  };
}

function buildDevScenarioBounty(stage = devScenarioStage) {
  const users = getDevScenarioUsers();
  const now = Date.now();
  const base = {
    id: DEV_SCENARIO_ID,
    numId: 20260602,
    title: 'DEV 시나리오: 번역 작업 마일스톤 테스트',
    desc: '등록부터 지원, 선정, 제출, 수정 요청, 재제출, 승인/정산까지 화면 흐름을 확인하기 위한 DEV 전용 바운티입니다.',
    categoryId: 'translation',
    reward: 10,
    deadline: '7일',
    createdAt: now - 3600000,
    likes: 0,
    requester: users.requester.address,
    requesterShort: users.requester.shortAddress,
    worker: '',
    workerShort: '',
    matchingType: 'approval',
    paymentType: 'milestone',
    currentMilestone: 0,
    milestones: [
      { id: 'm_0', title: '초안 번역 제출', percent: 40, reward: 4, status: 'active' },
      { id: 'm_1', title: '최종본 검수 반영', percent: 60, reward: 6, status: 'pending' },
    ],
    status: 'open',
    applicantCount: 1,
    _applicants: [
      {
        worker: users.worker.address,
        workerShort: users.worker.shortAddress,
        message: '번역 문서 작업 경험이 있고, 초안과 최종본을 마일스톤별로 제출하겠습니다.',
        applied_at: Math.floor((now - 1800000) / 1000),
      },
    ],
  };

  if (stage === 'open-applied') {
    base.myApplication = base._applicants[0];
  }
  if (['progress', 'review-public', 'review-private', 'revision', 'done'].includes(stage)) {
    base.status = stage === 'done' ? 'done' : (stage.startsWith('review') ? 'review' : 'progress');
    base.worker = users.worker.address;
    base.workerShort = users.worker.shortAddress;
  }
  if (stage === 'review-public') {
    base.submission = {
      proofBundle: '0x' + 'b'.repeat(64),
      summary: buildSubmissionSummary('초안 번역을 완료했습니다. 링크에서 결과물과 변경 메모를 확인할 수 있습니다.', 'https://example.com/dev-proof'),
      submittedAt: now - 600000,
    };
  }
  if (stage === 'review-private') {
    base.submission = {
      proofBundle: '0x' + 'c'.repeat(64),
      summary: buildSubmissionSummary('비공개 문서 번역본을 별도 승인 채널로 전달했습니다.', '', 'private'),
      submittedAt: now - 600000,
    };
  }
  if (stage === 'revision') {
    base.submission = {
      proofBundle: '0x' + 'd'.repeat(64),
      summary: buildSubmissionSummary('수정 요청 반영 전 초안입니다.', 'https://example.com/dev-proof'),
      submittedAt: now - 900000,
    };
    base.revisionRequest = '용어집 기준과 다르게 번역된 항목 3개를 수정하고, 최종본에는 변경 요약을 추가해주세요.';
    base.revisionCount = 1;
  }
  if (stage === 'done') {
    base.currentMilestone = 1;
    base.milestones = [
      { id: 'm_0', title: '초안 번역 제출', percent: 40, reward: 4, status: 'done' },
      { id: 'm_1', title: '최종본 검수 반영', percent: 60, reward: 6, status: 'done' },
    ];
  }
  if (stage === 'abandon-needed') {
    base.status = 'progress';
    base.worker = users.worker.address;
    base.workerShort = users.worker.shortAddress;
    base.desc = '작업자가 중간에 포기하고 싶은 상황을 가정합니다. 현재 앱/컨트랙트에는 포기 트랜잭션과 평판 반영 구조가 아직 없습니다.';
    base.revisionRequest = 'DEV 메모: 포기 기능은 컨트랙트 수정이 필요한 항목입니다.';
  }
  return base;
}

function renderDevScenarioPanel() {
  const content = document.getElementById('devScenarioContent');
  if (!content) return;
  const stages = [
    ['open-approval', '등록됨'],
    ['open-applied', '작업자 지원'],
    ['progress', '선정/진행'],
    ['review-public', '공개 제출'],
    ['review-private', '비공개 제출'],
    ['revision', '수정요청'],
    ['done', '승인/정산'],
    ['abandon-needed', '포기 필요'],
  ];
  const stageButtons = stages.map(([id, label]) => {
    const active = id === devScenarioStage;
    return `<button type="button" onclick="setDevScenarioStage('${id}')" class="px-3 py-2 rounded-lg text-xs font-semibold ${active ? 'premium-btn text-white' : 'premium-secondary-btn'}">${label}</button>`;
  }).join('');
  content.innerHTML = `
    <div class="space-y-4">
      <div class="bg-white/10 rounded-xl p-3 text-xs text-white/85 border border-white/15">
        <div class="font-semibold text-white mb-1">DEV 전용 시나리오 테스트</div>
        <div class="leading-relaxed">실제 트랜잭션 없이 역할과 상태를 바꿔 등록부터 정산까지 화면 흐름을 확인합니다. 라이브와 실제 컨트랙트 상태에는 영향이 없습니다.</div>
      </div>
      <div>
        <div class="text-xs font-semibold text-white/70 mb-2">역할</div>
        <div class="grid grid-cols-2 gap-2">
          <button type="button" onclick="setDevScenarioRole('requester')" class="px-3 py-2 rounded-lg text-xs font-semibold ${devScenarioRole === 'requester' ? 'premium-btn text-white' : 'premium-secondary-btn'}">의뢰자</button>
          <button type="button" onclick="setDevScenarioRole('worker')" class="px-3 py-2 rounded-lg text-xs font-semibold ${devScenarioRole === 'worker' ? 'premium-btn text-white' : 'premium-secondary-btn'}">작업자</button>
        </div>
      </div>
      <div>
        <div class="text-xs font-semibold text-white/70 mb-2">상태</div>
        <div class="grid grid-cols-2 gap-2">${stageButtons}</div>
      </div>
      <div class="bg-white/10 rounded-xl p-3 text-xs text-white/85 border border-white/15">
        <div class="font-semibold text-white mb-1">확인 포인트</div>
        <div class="leading-relaxed">수정요청 사유 표시, 비공개 제출 안내, 마일스톤 현재 단계, 포기 기능 부재 안내가 자연스러운지 확인해주세요.</div>
      </div>
      <div class="flex gap-2">
        <button type="button" onclick="openDetail('${DEV_SCENARIO_ID}')" class="flex-1 px-4 py-2.5 rounded-xl premium-btn text-white font-semibold text-sm">상세 화면 보기</button>
        <button type="button" onclick="closeDevScenarioPanel()" class="flex-1 px-4 py-2.5 rounded-xl premium-secondary-btn font-semibold text-sm">닫기</button>
      </div>
    </div>
  `;
}

function applyDevScenario() {
  const users = getDevScenarioUsers();
  currentUser = users[devScenarioRole];
  bounties[DEV_SCENARIO_ID] = buildDevScenarioBounty(devScenarioStage);
  if (devScenarioRole === 'worker' && devScenarioStage === 'open-applied') {
    bounties[DEV_SCENARIO_ID].myApplication = bounties[DEV_SCENARIO_ID]._applicants[0];
  }
  activeStatus = 'all';
  feedMode = 'all';
  displayCount = PAGE_SIZE;
  updateUserUI();
  renderStatusTabs();
  renderHome();
  renderDevScenarioPanel();
}

function setDevScenarioRole(role) {
  devScenarioRole = role;
  applyDevScenario();
  showToast(role === 'requester' ? 'DEV 역할: 의뢰자' : 'DEV 역할: 작업자');
}

function setDevScenarioStage(stage) {
  devScenarioStage = stage;
  applyDevScenario();
  showToast('DEV 시나리오 상태가 변경됐어요');
}

function openDevScenarioPanel() {
  if (!document.getElementById('devScenarioPanel')) {
    const modal = document.createElement('div');
    modal.id = 'devScenarioPanel';
    modal.className = 'fixed inset-0 z-[80] hidden items-center justify-center p-4 modal-backdrop';
    modal.innerHTML = '<div class="modal-content rounded-3xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto"><div class="flex items-start justify-between mb-4"><div><div class="text-xs text-white/50 font-semibold">bounX DEV</div><h3 class="text-lg font-bold text-white">시나리오 테스트</h3></div><button type="button" onclick="closeDevScenarioPanel()" class="w-9 h-9 rounded-full premium-secondary-btn text-sm font-bold">×</button></div><div id="devScenarioContent"></div></div>';
    document.body.appendChild(modal);
  }
  document.getElementById('devScenarioPanel').classList.remove('hidden');
  document.getElementById('devScenarioPanel').classList.add('flex');
  applyDevScenario();
}

function closeDevScenarioPanel() {
  document.getElementById('devScenarioPanel')?.classList.add('hidden');
  document.getElementById('devScenarioPanel')?.classList.remove('flex');
}

function installProofDevPreviewButton() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('devProof') !== '1' || document.getElementById('proofDevPreviewBtn')) return;
  const btn = document.createElement('button');
  btn.id = 'proofDevPreviewBtn';
  btn.type = 'button';
  btn.textContent = '증빙 제출 테스트';
  btn.onclick = openProofDevPreview;
  btn.className = 'fixed left-4 bottom-24 z-[60] px-4 py-2.5 rounded-xl premium-btn text-white text-sm font-semibold shadow-2xl';
  document.body.appendChild(btn);

  const reviewBtn = document.createElement('button');
  reviewBtn.id = 'reviewDevPreviewBtn';
  reviewBtn.type = 'button';
  reviewBtn.textContent = '마일스톤 승인 테스트';
  reviewBtn.onclick = openReviewDevPreview;
  reviewBtn.className = 'fixed left-4 bottom-10 z-[60] px-4 py-2.5 rounded-xl premium-secondary-btn text-sm font-semibold shadow-2xl';
  document.body.appendChild(reviewBtn);

  const scenarioBtn = document.createElement('button');
  scenarioBtn.id = 'scenarioDevPreviewBtn';
  scenarioBtn.type = 'button';
  scenarioBtn.textContent = '시나리오 테스트';
  scenarioBtn.onclick = openDevScenarioPanel;
  scenarioBtn.className = 'fixed left-4 bottom-40 z-[60] px-4 py-2.5 rounded-xl premium-secondary-btn text-sm font-semibold shadow-2xl';
  document.body.appendChild(scenarioBtn);
}

function installDevEnvironmentBadge() {
  if (document.getElementById('devEnvironmentBadge')) return;
  const isDevHost = window.location.hostname === '127.0.0.1'
    || window.location.hostname === 'localhost'
    || window.location.pathname.includes('/bounxapp-dev/');
  if (!isDevHost) return;
  const badge = document.createElement('div');
  badge.id = 'devEnvironmentBadge';
  badge.innerHTML = `<span>DEV TESTNET</span><span class="text-white/45">·</span><span>${APP_VERSION}</span>`;
  badge.className = 'fixed right-4 bottom-4 z-[70] flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-[11px] font-bold tracking-wide shadow-2xl backdrop-blur-md';
  document.body.appendChild(badge);
}



['createModal', 'detailModal', 'workModal', 'reviewModal', 'settlementModal', 'walletConnectModal', 'applyModal', 'applicantsModal'].forEach(id => {
  document.getElementById(id).addEventListener('click', (e) => {
    if (e.target.id === id) { document.getElementById(id).classList.add('hidden'); document.getElementById(id).classList.remove('flex'); }
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    ['createModal', 'detailModal', 'workModal', 'reviewModal', 'settlementModal', 'applyModal', 'applicantsModal'].forEach(id => {
      document.getElementById(id).classList.add('hidden'); document.getElementById(id).classList.remove('flex');
    });
  }
});

loadInterests();
installDevEnvironmentBadge();
installProofDevPreviewButton();

// ============ XPLA Panel (debug tools) ============

async function xplaQueryConfig() {
  const btn = document.getElementById('xplaQueryBtn');
  const result = document.getElementById('xplaConfigResult');
  btn.disabled = true; btn.textContent = '조회 중...';
  try {
    const c = await fetchConfig();
    result.innerHTML = `<div class="space-y-2 text-sm">
      <div class="flex justify-between"><span class="text-white/50">Admin</span><span class="font-mono text-[11px] text-emerald-300">${c.admin.slice(0,16)}...</span></div>
      <div class="flex justify-between"><span class="text-white/50">Treasury</span><span class="font-mono text-[11px] text-emerald-300">${c.treasury.slice(0,16)}...</span></div>
      <div class="border-t border-white/5 my-1"></div>
      <div class="flex justify-between"><span class="text-white/50">Worker</span><span class="text-white font-semibold">${c.fee_worker_bps/100}%</span></div>
      <div class="flex justify-between"><span class="text-white/50">Validator</span><span class="text-white font-semibold">${c.fee_validator_bps/100}%</span></div>
      <div class="flex justify-between"><span class="text-white/50">Burn</span><span class="text-white font-semibold">${c.fee_burn_bps/100}%</span></div>
      <div class="flex justify-between"><span class="text-white/50">Eco·Team</span><span class="text-white font-semibold">${c.fee_eco_team_bps/100}%</span></div>
      <div class="border-t border-white/5 my-1"></div>
      <div class="flex justify-between"><span class="text-white/50">만료 기간</span><span class="text-white">${c.expiration_seconds/86400}일</span></div>
      <div class="flex justify-between"><span class="text-white/50">Denom</span><span class="text-white font-mono text-xs">${c.native_denom}</span></div>
    </div>`;
    result.classList.remove('hidden');
  } catch (e) {
    result.innerHTML = `<div class="text-red-400 text-sm">조회 실패: ${e.message}</div>`;
    result.classList.remove('hidden');
  }
  btn.disabled = false; btn.textContent = 'Config 조회';
}

function xplaCreateBounty() {
  const title = document.getElementById('cbTitle').value.trim();
  const desc = document.getElementById('cbDesc').value.trim();
  const category = document.getElementById('cbCategory').value;
  const reward = document.getElementById('cbReward').value;
  if (!title) { showToast('제목을 입력하세요'); return; }
  if (!reward || parseFloat(reward) <= 0) { showToast('보상 금액을 입력하세요'); return; }
  const deadlineSeconds = Math.floor(Date.now() / 1000) + 14 * 86400;
  const executeMsg = {
    create_bounty: { title, description: desc || title, category, external_link: null, deadline: deadlineSeconds, matching_type: 'approval', payment_type: 'lump', milestones: [] }
  };
  executeContract(executeMsg, xplaToAxpla(reward), '등록 완료!').catch(() => {});
}

function openXplaPanel() {
  document.getElementById('xplaPanel').classList.remove('hidden');
  document.getElementById('xplaPanel').classList.add('flex');
  if (currentUser) {
    document.getElementById('xplaAddrInput').value = currentUser.address;
  }
}
function closeXplaPanel() {
  document.getElementById('xplaPanel').classList.add('hidden');
  document.getElementById('xplaPanel').classList.remove('flex');
}
document.getElementById('xplaPanel').addEventListener('click', (e) => {
  if (e.target.id === 'xplaPanel') closeXplaPanel();
});
