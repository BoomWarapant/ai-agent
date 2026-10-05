# CRD: bot computer = crd/computer:v0.1.6-th (Thai fonts) + Python libraries used by CRD skills
# + skill folders at /opt/crd-skills (read-only) + Google Drive helpers gdls2/gdtree/gdread
# at /usr/local/bin (bin/, see DECISIONS D22). Built by scripts/wsl/build-skills.sh;
# build context = ~/rakazo/computer-crd (skills/ is staged there, not stored in the repo).
# Python versions pinned to what was tested on the pilot machine (2026-10-04).
FROM crd/computer:v0.1.6-th
USER root
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3-pip \
 && rm -rf /var/lib/apt/lists/* \
 && pip3 install --no-cache-dir --break-system-packages \
      openpyxl==3.1.5 python-docx==1.2.0 pythainlp==5.3.8 rapidfuzz==3.14.6 \
      matplotlib==3.11.2 PyMuPDF==1.28.2 ezdxf==1.4.4 shapely==2.1.2 \
 && python3 -c "import openpyxl, docx, pythainlp, rapidfuzz, matplotlib, fitz, ezdxf, shapely; print('crd python libs ok')"
COPY skills/ /opt/crd-skills/
RUN chmod -R a+rX,go-w /opt/crd-skills
COPY bin/gdls2 bin/gdtree bin/gdread /usr/local/bin/
RUN chmod 755 /usr/local/bin/gdls2 /usr/local/bin/gdtree /usr/local/bin/gdread
USER 1000:1000
